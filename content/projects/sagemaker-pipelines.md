---
title: "End-to-End ML Pipeline with SageMaker Pipelines"
date: 2025-09-01
draft: false
tags: ["Python", "AWS SageMaker", "XGBoost", "MLOps", "AWS S3"]
projectCategory: "ml"
featured: true
weight: 1
description: "A four-step SageMaker Pipeline covering data preprocessing, XGBoost model training, model creation, and batch inference — fully orchestrated and reproducible."
---

## Overview

SageMaker Pipelines lets you define a directed acyclic graph (DAG) of ML steps that SageMaker executes, tracks, and makes reproducible. This project builds a complete pipeline over a retail sales dataset: raw data in S3 goes in, predictions come out, with every intermediate artefact versioned and auditable.

The four steps in the pipeline:

```
PreprocessData → TrainModel → CreateInferenceModel → BatchInference
```

## The Dataset

Walmart retail sales data with three source tables (features, sales, stores). The target is weekly sales per store — a regression problem.

## Step 1: Preprocessing with `ProcessingStep`

A `ScriptProcessor` runs a custom Python script inside a scikit-learn container. It merges the three tables, engineers time features, one-hot encodes categoricals, splits into train/validation/test, and writes artefacts to S3.

```python
processor = ScriptProcessor(
    image_uri="246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3",
    command=["python3"],
    role=role,
    instance_count=1,
    instance_type="ml.t3.medium",
    sagemaker_session=pipeline_session,
)

processing_step = ProcessingStep(
    name="PreprocessData",
    processor=processor,
    code="s3://my-bucket/pipelines/scripts/processing_script.py",
    inputs=[
        ProcessingInput(source="s3://my-bucket/raw/features.csv",
                        destination="/opt/ml/processing/features"),
        ProcessingInput(source="s3://my-bucket/raw/sales.csv",
                        destination="/opt/ml/processing/sales"),
    ],
    outputs=[
        ProcessingOutput(output_name="train",
                         source="/opt/ml/processing/output/train",
                         destination="s3://my-bucket/pipelines/data/train"),
        ProcessingOutput(output_name="validation",
                         source="/opt/ml/processing/output/validation",
                         destination="s3://my-bucket/pipelines/data/validation"),
        ProcessingOutput(output_name="test",
                         source="/opt/ml/processing/output/test",
                         destination="s3://my-bucket/pipelines/data/test"),
    ],
)
```

## Step 2: Training with `TrainingStep`

Uses SageMaker's built-in XGBoost container. Spot instances keep cost down; `max_wait` is set higher than `max_run` to account for spot interruption retries.

```python
estimator = Estimator(
    image_uri="246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-xgboost:1.5-1",
    role=role,
    instance_count=1,
    instance_type="ml.m5.large",
    use_spot_instances=True,
    max_run=150,
    max_wait=480,
    hyperparameters={
        "objective": "reg:squarederror",
        "max_depth": "10",
        "eta": "0.1",
        "num_round": "200",
    },
    sagemaker_session=pipeline_session,
)

training_step = TrainingStep(
    name="TrainModel",
    estimator=estimator,
    inputs={
        "train": TrainingInput(
            s3_data=processing_step.properties.ProcessingOutputConfig
                        .Outputs["train"].S3Output.S3Uri,
            content_type="text/csv",   # must be explicit — XGBoost defaults to libsvm
        ),
        "validation": TrainingInput(
            s3_data=processing_step.properties.ProcessingOutputConfig
                        .Outputs["validation"].S3Output.S3Uri,
            content_type="text/csv",
        ),
    },
)
```

Key lesson: always set `content_type="text/csv"` explicitly. XGBoost's built-in container assumes libsvm format by default — omitting this causes a cryptic validation error at runtime.

## Step 3: Model Creation with `ModelStep`

Converts training artefacts (`.tar.gz` in S3) into a deployable SageMaker Model resource. This is the bridge between training and inference.

```python
model = Model(
    image_uri="246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-xgboost:1.5-1",
    model_data=training_step.properties.ModelArtifacts.S3ModelArtifacts,
    role=role,
    sagemaker_session=pipeline_session,
)

create_model_step = ModelStep(
    name="CreateInferenceModel",
    step_args=model.create(instance_type="ml.m5.large"),
)
```

## Step 4: Batch Inference with `TransformStep`

The test set (48 MB) was too large for a single transform request (default `max_payload=6 MB`). Solution: add a parallel `SplitTestCSV` processing step that chunks the test file, then run `TransformStep` over the directory of chunks.

```python
transformer = Transformer(
    model_name=create_model_step.properties.ModelName,
    instance_type="ml.m5.large",
    instance_count=1,
    output_path="s3://my-bucket/pipelines/data/predictions",
    strategy="SingleRecord",
    assemble_with="Line",
    max_payload=50,
    sagemaker_session=pipeline_session,
)

transform_step = TransformStep(
    name="BatchInference",
    transformer=transformer,
    inputs=TransformInput(
        data="s3://my-bucket/pipelines/data/test/split/",
        content_type="text/csv",
    ),
)
```

The `SplitTestCSV` step runs in parallel with `TrainModel` — SageMaker Pipelines infers the dependency graph from input/output wiring, so `BatchInference` waits for both branches automatically.

## Assembling and Running the Pipeline

```python
pipeline = Pipeline(
    name="SalesPredictionPipeline",
    steps=[processing_step, training_step, create_model_step, transform_step],
    sagemaker_session=pipeline_session,
)

pipeline.upsert(role_arn=role)
execution = pipeline.start()
```

The pipeline is visible in SageMaker Studio under **Pipelines**, with per-step logs, timing, and artefact lineage.

## Results

- Full pipeline runs end-to-end without manual intervention
- Spot instances on training cut compute cost by ~70% vs on-demand
- Pipeline is idempotent: `upsert` updates the definition without creating duplicates
- All artefacts (processed data, model, predictions) versioned in S3 with pipeline execution ID

## Tech Stack

- **Orchestration** — AWS SageMaker Pipelines
- **Modelling** — SageMaker built-in XGBoost
- **Processing** — SageMaker Processing Jobs (scikit-learn container)
- **Inference** — SageMaker Batch Transform
- **Storage** — AWS S3
- **Language** — Python (sagemaker SDK)
