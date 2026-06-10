---
title: "ML Workflow Orchestration with AWS Step Functions"
date: 2025-08-01
draft: false
tags: ["Python", "AWS Step Functions", "AWS SageMaker", "MLOps", "IAM"]
projectCategory: "data-eng"
featured: true
weight: 2
description: "Orchestrating SageMaker Processing, Training, and Inference jobs end-to-end using AWS Step Functions state machines."
---

## Overview

AWS Step Functions lets you orchestrate multi-step workflows as state machines — each state can invoke an AWS service, branch on conditions, retry on failure, or run steps in parallel. This project uses Step Functions to wire together SageMaker Processing, Training, and Batch Transform jobs into a production-grade ML workflow that can be triggered on a schedule or by an event.

The key difference from SageMaker Pipelines: Step Functions is AWS-native orchestration for *any* service combination (SageMaker + Lambda + Glue + SNS), whereas SageMaker Pipelines is ML-specific. For workflows that touch multiple AWS services, Step Functions is the right tool.

## Architecture

```
EventBridge (schedule) → Step Functions State Machine
                              │
                    ┌─────────┴──────────┐
              ProcessingJob          (parallel branch)
                    │
               TrainingJob
                    │
              CreateModelJob
                    │
             BatchTransformJob
```

## IAM Permissions

A Step Functions execution role needs explicit permission to call SageMaker APIs. The minimum required policy covers five categories:

1. **EventBridge** — for scheduled triggers
2. **SageMaker** — create/describe/stop jobs and add tags
3. **S3** — read inputs, write outputs
4. **CloudWatch Logs** — execution logging
5. **IAM PassRole** — so Step Functions can hand the SageMaker execution role to each job

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:CreateProcessingJob",
        "sagemaker:DescribeProcessingJob",
        "sagemaker:StopProcessingJob",
        "sagemaker:CreateTrainingJob",
        "sagemaker:DescribeTrainingJob",
        "sagemaker:CreateTransformJob",
        "sagemaker:DescribeTransformJob",
        "sagemaker:AddTags"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::<account_id>:role/<sagemaker-execution-role>"
    }
  ]
}
```

## Processing Step (State Definition)

Each state in the Step Functions definition maps directly to a SageMaker API call. The `Resource` field selects the synchronous `.sync:2` variant — Step Functions polls until the job completes before advancing to the next state.

```json
"ProcessData": {
  "Type": "Task",
  "Resource": "arn:aws:states:::sagemaker:createProcessingJob.sync:2",
  "Parameters": {
    "ProcessingJobName.$": "States.Format('processing-{}', $$.Execution.Name)",
    "ProcessingResources": {
      "ClusterConfig": {
        "InstanceCount": 1,
        "InstanceType": "ml.t3.medium",
        "VolumeSizeInGB": 8
      }
    },
    "AppSpecification": {
      "ImageUri": "246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3",
      "ContainerEntrypoint": ["python3", "/opt/ml/processing/input/code/processing_script.py"]
    },
    "ProcessingInputs": [...],
    "ProcessingOutputConfig": {...},
    "RoleArn": "arn:aws:iam::<account_id>:role/<sagemaker-execution-role>"
  },
  "Next": "TrainModel"
}
```

`States.Format` constructs a unique job name from the execution ID — prevents name collisions when the workflow runs multiple times.

## Training Step

```json
"TrainModel": {
  "Type": "Task",
  "Resource": "arn:aws:states:::sagemaker:createTrainingJob.sync:2",
  "Parameters": {
    "TrainingJobName.$": "States.Format('training-{}', $$.Execution.Name)",
    "AlgorithmSpecification": {
      "TrainingImage": "246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-xgboost:1.5-1",
      "TrainingInputMode": "File"
    },
    "HyperParameters": {
      "objective": "reg:squarederror",
      "num_round": "200",
      "max_depth": "10"
    },
    "InputDataConfig": [
      {
        "ChannelName": "train",
        "DataSource": {
          "S3DataSource": {
            "S3Uri.$": "$.train_data_uri",
            "S3DataType": "S3Prefix"
          }
        },
        "ContentType": "text/csv"
      }
    ],
    "OutputDataConfig": {
      "S3OutputPath": "s3://my-bucket/step-functions/model/"
    },
    "ResourceConfig": {
      "InstanceType": "ml.m5.large",
      "InstanceCount": 1,
      "VolumeSizeInGB": 10
    },
    "StoppingCondition": { "MaxRuntimeInSeconds": 600 }
  },
  "Next": "BatchInference"
}
```

Input URIs are passed as execution input (`$.train_data_uri`) — the state machine is parameterised, not hardcoded.

## Passing Data Between Steps

Step Functions offers three mechanisms for inter-step data flow:

| Mechanism | Use when |
|---|---|
| Step output properties | Passing S3 URIs, model artefact paths — no extra code needed |
| `PropertyFile` + JSON | Custom metrics or branching decisions (e.g., file size check) |
| Pipeline parameters | Fixed configuration shared across all executions |

For the training-to-inference handoff, the model artefact S3 path flows directly via `ResultPath` without writing any JSON file.

## Conditional Branching Example

A file-size check before inference prevents the `413 Request Entity Too Large` error that occurs when a test file exceeds the batch transform `max_payload`:

```python
# check_file_size.py — runs in a ProcessingStep
size_mb = os.path.getsize(input_path) / 1e6
with open(output_path, "w") as f:
    json.dump({"size_mb": size_mb}, f)
```

```json
"CheckFileSize": {
  "Type": "Choice",
  "Choices": [
    {
      "Variable": "$.size_mb",
      "NumericGreaterThan": 5,
      "Next": "SplitAndInfer"
    }
  ],
  "Default": "DirectInfer"
}
```

## Results

- End-to-end workflow runs on a scheduled EventBridge trigger with zero manual steps
- Unique job names per execution via `States.Format` prevent collisions across runs
- Conditional branching handles large test files automatically
- Full execution history, step-level logs, and retry counts visible in the Step Functions console

## Tech Stack

- **Orchestration** — AWS Step Functions
- **ML Jobs** — AWS SageMaker (Processing, Training, Batch Transform)
- **Scheduling** — Amazon EventBridge
- **Storage** — AWS S3
- **Permissions** — AWS IAM
- **Monitoring** — Amazon CloudWatch Logs
