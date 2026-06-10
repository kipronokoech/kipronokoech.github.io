---
title: "SageMaker Jobs: Processing, Training, Inference & HPT"
date: 2025-07-01
draft: false
tags: ["Python", "AWS SageMaker", "XGBoost", "Hyperparameter Tuning", "MLOps"]
projectCategory: "ml"
weight: 3
description: "Hands-on walkthrough of SageMaker's four core job types — Processing, Training, Batch Transform, and Hyperparameter Tuning — on a retail sales dataset."
---

## Overview

Before building automated pipelines, it helps to understand SageMaker's individual building blocks. This project exercises all four core SageMaker job types using a Walmart retail sales dataset and SageMaker's built-in XGBoost algorithm. Each job type solves a distinct phase of the ML workflow and runs on managed, ephemeral compute — no servers to provision or maintain.

| Job Type | Purpose |
|---|---|
| Processing Job | Data prep, feature engineering, evaluation |
| Training Job | Model fitting |
| Batch Transform Job | Offline inference on large datasets |
| Hyperparameter Tuning Job | Automated hyperparameter search |

## The Dataset

Three CSV tables from Walmart historical sales data — features, weekly sales, and store metadata — merged and engineered into a regression dataset predicting weekly store sales.

## Processing Job

A `ScriptProcessor` runs a custom preprocessing script in a managed container. The script merges the three tables, creates time features, one-hot encodes store type, splits into train/validation/test, and writes each split back to S3.

```python
from sagemaker.processing import ScriptProcessor, ProcessingInput, ProcessingOutput

processor = ScriptProcessor(
    image_uri="246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3",
    command=["python3"],
    role=role,
    instance_count=1,
    instance_type="ml.t3.medium",
)

processor.run(
    code="processing_script.py",
    inputs=[
        ProcessingInput(source="s3://bucket/raw/features.csv",
                        destination="/opt/ml/processing/input/features"),
        ProcessingInput(source="s3://bucket/raw/sales.csv",
                        destination="/opt/ml/processing/input/sales"),
        ProcessingInput(source="s3://bucket/raw/stores.csv",
                        destination="/opt/ml/processing/input/stores"),
    ],
    outputs=[
        ProcessingOutput(output_name="train",
                         source="/opt/ml/processing/output/train",
                         destination="s3://bucket/data/train"),
        ProcessingOutput(output_name="validation",
                         source="/opt/ml/processing/output/validation",
                         destination="s3://bucket/data/validation"),
        ProcessingOutput(output_name="test",
                         source="/opt/ml/processing/output/test",
                         destination="s3://bucket/data/test"),
    ],
)
```

**Key constraint:** SageMaker's built-in XGBoost expects CSV with no header row and the target variable in the first column.

## Training Job

`Estimator` spins up a managed training cluster, pulls the XGBoost container, trains on the S3 data, and writes the model artefact (`.tar.gz`) back to S3.

```python
from sagemaker.estimator import Estimator
from sagemaker.inputs import TrainingInput

estimator = Estimator(
    image_uri="246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-xgboost:1.5-1",
    role=role,
    instance_count=1,
    instance_type="ml.m5.large",
    use_spot_instances=True,
    max_run=300,
    max_wait=600,
    hyperparameters={
        "objective": "reg:squarederror",
        "max_depth": 10,
        "eta": 0.1,
        "num_round": 200,
    },
    enable_sagemaker_metrics=True,
)

estimator.fit({
    "train": TrainingInput("s3://bucket/data/train/", content_type="text/csv"),
    "validation": TrainingInput("s3://bucket/data/validation/", content_type="text/csv"),
})
```

`enable_sagemaker_metrics=True` surfaces training and validation loss in CloudWatch, making it easy to spot overfitting.

## Batch Transform Job

`Transformer` runs inference over the full test set without a persistent endpoint — ideal for scheduled batch scoring.

```python
from sagemaker.transformer import Transformer

transformer = estimator.transformer(
    instance_count=1,
    instance_type="ml.m5.large",
    output_path="s3://bucket/predictions/",
    strategy="SingleRecord",
    assemble_with="Line",
)

transformer.transform(
    data="s3://bucket/data/test/test_no_label.csv",
    content_type="text/csv",
    split_type="Line",
)
transformer.wait()
```

The test file must have no header and no target column — only feature columns — since the XGBoost container infers the target position from training.

## Hyperparameter Tuning Job

`HyperparameterTuner` runs parallel training jobs across a search space, optimising a defined objective metric. Bayesian optimisation is used by default — each trial informs the next.

```python
from sagemaker.tuner import HyperparameterTuner, IntegerParameter, ContinuousParameter

tuner = HyperparameterTuner(
    estimator=estimator,
    objective_metric_name="validation:rmse",
    objective_type="Minimize",
    hyperparameter_ranges={
        "max_depth": IntegerParameter(3, 12),
        "eta": ContinuousParameter(0.01, 0.3),
        "alpha": ContinuousParameter(0, 20),
        "colsample_bytree": ContinuousParameter(0.3, 1.0),
    },
    max_jobs=20,
    max_parallel_jobs=4,
    strategy="Bayesian",
)

tuner.fit({
    "train": TrainingInput("s3://bucket/data/train/", content_type="text/csv"),
    "validation": TrainingInput("s3://bucket/data/validation/", content_type="text/csv"),
})
```

After completion, the best job's hyperparameters and its model artefact are retrievable via `tuner.best_training_job()`.

## Results

- All four job types successfully exercised on the same dataset end-to-end
- Spot instances on training and HPT reduced compute spend by ~65%
- HPT found a configuration that improved validation RMSE by ~12% over the manual baseline
- Model artefacts, logs, and metrics all versioned in S3/CloudWatch with no manual bookkeeping

## Tech Stack

- **Compute** — AWS SageMaker (Processing, Training, Transform, HPT jobs)
- **Algorithm** — SageMaker built-in XGBoost
- **Storage** — AWS S3
- **Monitoring** — Amazon CloudWatch Metrics
- **Language** — Python (sagemaker SDK, boto3)
