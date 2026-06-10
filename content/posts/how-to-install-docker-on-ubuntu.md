---
date: '2026-06-10T00:00:00+03:00'
draft: false
title: 'How to Install Docker on Ubuntu (Including EC2)'
description: "Step-by-step guide to installing Docker Engine and Docker Compose on Ubuntu — works identically on a local machine or an AWS EC2 instance."
tags: ["Docker", "Ubuntu", "Linux", "AWS", "DevOps"]
categories: []
showtoc: true
---

Ubuntu is the most common Linux distribution for running Docker — whether on a local dev machine, a CI runner, or an EC2 instance. The install process is the same in all three cases.

## Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

## Install Required Packages

```bash
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
```

## Add Docker's Official GPG Key

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

## Add the Docker Repository

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

## Install Docker Engine

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
```

## Start Docker and Enable at Boot

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

## Allow Non-Root Usage (Recommended)

By default, Docker commands require `sudo`. Add your user to the `docker` group to remove that requirement:

```bash
sudo usermod -aG docker $USER
```

> Log out and back in (or run `newgrp docker`) for the group change to take effect.

## Verify the Installation

```bash
docker run hello-world
```

You should see a "Hello from Docker!" confirmation message.

---

## Install Docker Compose

Docker Compose is distributed as a standalone binary:

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

---

## Practical Example: Containerising a Python ML Script

A common use case: you have a Python script that runs on EC2 and you want to package it so it runs identically everywhere.

**Project structure:**
```
my-pipeline/
├── Dockerfile
├── requirements.txt
└── process.py
```

**`requirements.txt`:**
```
pandas
boto3
scikit-learn
```

**`Dockerfile`:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "process.py"]
```

**Build and run:**
```bash
docker build -t my-pipeline .
docker run my-pipeline
```

**Run with a mounted volume** (so the container reads/writes local files):
```bash
docker run -v $(pwd)/data:/app/data my-pipeline
```

---

## Useful Commands Reference

| Command | What it does |
|---|---|
| `docker ps` | List running containers |
| `docker ps -a` | List all containers (including stopped) |
| `docker images` | List local images |
| `docker stop <id>` | Stop a running container |
| `docker rm <id>` | Remove a stopped container |
| `docker rmi <image>` | Remove an image |
| `docker logs <id>` | View container logs |
| `docker exec -it <id> bash` | Shell into a running container |

---

That's all you need to get Docker running on Ubuntu. The same steps work on a fresh EC2 instance — just SSH in first and run them from there.
