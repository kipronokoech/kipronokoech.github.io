---
title: "Deploying an ML Model with a SageMaker Real-Time Endpoint"
date: 2025-11-01
draft: false
tags: ["Python", "AWS SageMaker", "Docker", "FastAPI", "AWS Lambda", "MLOps"]
projectCategory: "ml"
weight: 4
description: "End-to-end deployment of a LightGBM bank churn model as a SageMaker real-time endpoint — custom Docker inference server, ECR, and a Lambda function for automated S3-triggered inference."
---

## Overview

Training a model is the easy part. Getting it into production — where it serves real-time predictions reliably — is where most ML projects stall. This project deploys a trained bank churn model as a SageMaker real-time endpoint using a custom Docker inference container, then adds a Lambda function to automate inference whenever new data lands in S3.

The stack: FastAPI + uvicorn as the inference server, Docker for packaging, ECR for the registry, SageMaker for hosting, and Lambda + S3 for event-driven automation.

## Architecture

```
S3 (input CSV) → Lambda → SageMaker Endpoint → S3 (predictions)
                               │
                          Docker Container
                          (FastAPI + LightGBM)
                          hosted on ml.c5.large
```

## Model Artefacts from Training

Two files must come out of the training step:

- `model.joblib` — the serialised LightGBM / scikit-learn model
- `metadata.json` — the ordered list of feature names used during training

Both are zipped into `model.tar.gz` before SageMaker can use them. This metadata file is the insurance policy: it guarantees inference sees exactly the same features in the same order that training did.

## Building the Inference Container

The inference container has three files beyond the model artefacts:

### `inference.py` — FastAPI Model Server

SageMaker calls two endpoints on your container: `GET /ping` (health check) and `POST /invocations` (inference). The app loads the model once at startup and keeps it in memory across all requests.

```python
from fastapi import FastAPI, Request, HTTPException
import joblib, pandas as pd, json, io, os

app = FastAPI()
MODEL_PATH = "/opt/ml/model/model.joblib"   # SageMaker mounts artefacts here
METADATA_PATH = "/opt/ml/model/metadata.json"

model = None
feature_names = None

@app.on_event("startup")
def load_model():
    global model, feature_names
    model = joblib.load(MODEL_PATH)
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH) as f:
            feature_names = json.load(f).get("feature_names")

@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.post("/invocations")
async def invocations(request: Request):
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        payload = await request.json()
        records = payload["records"] if isinstance(payload, dict) else payload
        df = pd.DataFrame.from_records(records)
    elif "text/csv" in content_type:
        body = await request.body()
        df = pd.read_csv(io.StringIO(body.decode()))
    else:
        raise HTTPException(status_code=415, detail="Unsupported content type")

    if feature_names:
        missing = set(feature_names) - set(df.columns)
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing features: {missing}")
        df = df[feature_names]

    probs = model.predict_proba(df)[:, 1]
    preds = (probs > 0.5).astype(int)
    return {"predictions": preds.tolist(), "probabilities": probs.tolist()}
```

Key design decisions:
- Model loads once at startup — not per request. Critical for latency.
- Accepts both JSON and CSV — makes the same container usable from curl, Python, and Lambda without changes.
- Feature validation against `metadata.json` catches column drift before prediction.

### `entrypoint.sh` — Dual-Mode Container

The same image needs to work locally (for testing) and on SageMaker (which always runs `docker run <image> serve`). A minimal entrypoint handles both:

```bash
#!/bin/bash
CMD=${1:-serve}
if [ "$CMD" = "serve" ]; then
    exec uvicorn inference:app --host 0.0.0.0 --port 8080 --workers 1
else
    exec "$@"
fi
```

Locally you can run `docker run <image> bash` or `docker run <image> python inference.py`. SageMaker passes `serve` automatically. No separate images, no conditional builds.

### `Dockerfile`

```dockerfile
FROM python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/ml/code:${PATH}"
ENV OMP_NUM_THREADS=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /opt/ml/code/requirements.txt
RUN pip install --no-cache-dir -r /opt/ml/code/requirements.txt

COPY inference.py /opt/ml/code/inference.py
WORKDIR /opt/ml/code

EXPOSE 8080

COPY entrypoint.sh /opt/ml/code/entrypoint.sh
RUN chmod +x /opt/ml/code/entrypoint.sh
ENTRYPOINT ["/opt/ml/code/entrypoint.sh"]
```

`libgomp1` is required by LightGBM (OpenMP backend). `OMP_NUM_THREADS=1` pins it to a single thread for predictable low-latency inference rather than competing with other requests.

## Local Testing

Build and run the container with the model mounted in:

```makefile
build-inference:
    docker build -t bankchurn-inference:v1 ./inference

inference-local:
    docker run -p 8080:8080 \
        -v $(PWD)/output:/opt/ml/model \
        bankchurn-inference:v1 serve
```

Ping it:
```bash
curl http://localhost:8080/ping
# {"status":"ok"}
```

Send inference requests:
```bash
# JSON
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"records": [{"feature_1": 1.2, "feature_2": 0.4, ...}]}'

# CSV
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: text/csv" \
  --data-binary @sample.csv
```

Both return: `{"predictions": [1, 0], "probabilities": [0.981, 0.004]}`

## SageMaker Deployment

### Step 1: Build for `linux/amd64` and Push to ECR

Local Mac builds are ARM — SageMaker requires `linux/amd64`. `docker buildx` handles the cross-platform build in one command:

```makefile
ECR := 983511196003.dkr.ecr.us-west-2.amazonaws.com/bankchurn-inference:v1

login-ecr:
    aws ecr get-login-password --region us-west-2 | \
    docker login --username AWS --password-stdin 983511196003.dkr.ecr.us-west-2.amazonaws.com

push-ecr-inference: login-ecr
    docker buildx build --platform linux/amd64 \
        --provenance=false \
        -t $(ECR) --push ./inference
```

`--provenance=false` avoids an OCI manifest format that ECR doesn't support with `docker pull`.

### Step 2: Upload `model.tar.gz` to S3

If training ran locally, upload the artefact manually:
```bash
aws s3 cp output/model.tar.gz s3://my-bucket/bankchurn/output/model.tar.gz
```

If training ran on a SageMaker Training Job, the artefact is already in S3.

### Step 3: Register Model and Deploy Endpoint

```python
import sagemaker
from sagemaker.model import Model
from datetime import datetime

session = sagemaker.Session()
role = "arn:aws:iam::983511196003:role/AmazonSageMaker-ExecutionRole"
ecr_image = "983511196003.dkr.ecr.us-west-2.amazonaws.com/bankchurn-inference:v1"
model_artifact = "s3://my-bucket/bankchurn/output/model.tar.gz"

endpoint_name = f"bankchurn-endpoint-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

model = Model(
    image_uri=ecr_image,
    model_data=model_artifact,
    role=role,
    sagemaker_session=session,
)

predictor = model.deploy(
    initial_instance_count=1,
    instance_type="ml.c5.large",
    endpoint_name=endpoint_name,
    container_startup_health_check_timeout=60,
)

print(f"Deployed: {endpoint_name}")
```

Deployment takes about 2 minutes. The endpoint appears under SageMaker → Inference → Endpoints.

### Step 4: Invoke the Endpoint

```python
import boto3, json, pandas as pd

runtime = boto3.client("sagemaker-runtime")
df = pd.read_csv("data/test/test.csv").sample(n=3)

# JSON
response = runtime.invoke_endpoint(
    EndpointName=endpoint_name,
    ContentType="application/json",
    Accept="application/json",
    Body=json.dumps(df.to_dict(orient="records")),
)
print(json.loads(response["Body"].read()))
# {'predictions': [0, 1, 0], 'probabilities': [0.002, 0.982, 0.021]}

# CSV
response = runtime.invoke_endpoint(
    EndpointName=endpoint_name,
    ContentType="text/csv",
    Accept="text/csv",
    Body=df.to_csv(index=False),
)
```

## Lambda Automation: S3 Upload → Inference → Results in S3

Rather than calling the endpoint manually, a Lambda function triggers automatically when a CSV lands in an S3 prefix, invokes the endpoint, and writes predictions back to S3.

### IAM Policy for the Lambda Role

The Lambda execution role needs four permissions: `s3:GetObject`, `s3:PutObject`, `sagemaker:InvokeEndpoint`, and `logs:PutLogEvents`.

### Lambda Function

```python
import boto3, json, io, os

runtime = boto3.client("sagemaker-runtime")
s3 = boto3.client("s3")
ENDPOINT_NAME = os.environ["ENDPOINT_NAME"]

def lambda_handler(event, context):
    record = event["Records"][0]
    bucket = record["s3"]["bucket"]["name"]
    key = record["s3"]["object"]["key"]

    obj = s3.get_object(Bucket=bucket, Key=key)
    payload = obj["Body"].read().decode()

    response = runtime.invoke_endpoint(
        EndpointName=ENDPOINT_NAME,
        ContentType="text/csv",
        Accept="application/json",
        Body=payload,
    )
    prediction = response["Body"].read().decode()

    # Write to output/ prefix — must differ from trigger prefix to avoid recursion
    output_key = key.replace("input/", "output/") + ".predictions.json"
    s3.put_object(Bucket=bucket, Key=output_key,
                  Body=prediction.encode(), ContentType="application/json")

    return {"statusCode": 200, "input_file": key, "output_file": output_key}
```

### Setup Checklist

1. Runtime: Python 3.10
2. Attach the IAM policy above to the execution role
3. Add environment variable `ENDPOINT_NAME`
4. Add layer: `AWSSDKPandas-Python310` (for pandas in Lambda)
5. Add S3 trigger: event type `PUT`, prefix `input/`, suffix `.csv`

The output prefix in the Lambda (`output/`) must be different from the trigger prefix (`input/`) — same prefix causes recursive invocations.

## Cost

`ml.c5.large` (on-demand, us-west-2) runs at approximately **$0.102/hour** — about **$2.45/day** or **$73/month** if left running 24/7. Always delete endpoints you're not actively using:

```python
predictor.delete_endpoint()
```

Or from the console: SageMaker → Inference → Endpoints → Delete.

## Tech Stack

- **Inference server** — FastAPI + uvicorn (Python)
- **Model** — LightGBM / scikit-learn (joblib)
- **Container** — Docker (`python:3.10-slim`)
- **Registry** — AWS ECR
- **Hosting** — AWS SageMaker Real-Time Endpoint
- **Automation** — AWS Lambda + S3 event notifications
- **Permissions** — AWS IAM
