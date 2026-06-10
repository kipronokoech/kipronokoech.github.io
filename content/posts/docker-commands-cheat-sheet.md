---
title: "Docker Commands Cheat Sheet"
date: 2025-07-26
draft: false
description: "The most useful Docker commands grouped by what you actually do — build, run, inspect, clean, and manage images and containers."
tags: ["Docker", "DevOps", "Containers", "Linux"]
categories: ["Linux"]
showtoc: true
---

Here's a curated list of the most important Docker commands, grouped by what you actually do — not alphabetically.

## 1. Build & Tag Images

### `docker build -t name:tag .`

Builds an image from a Dockerfile in the current directory.

```bash
docker build -t my_app:latest .
```

Most common flags:

- `-f` — specify a different Dockerfile path
- `.` — the build context (current directory); omit `-f` when the Dockerfile is in the same directory
- `--no-cache` — force a full rebuild, skipping the layer cache
- `-t` / `--tag` — give the image a name and optional version tag; defaults to `latest` if omitted

**Pro tip:** Add a `.dockerignore` file to exclude unnecessary files (`__pycache__`, `.git`, data dumps) from the build context — it can dramatically speed up builds.

## 2. Run Containers

### `docker run [OPTIONS] IMAGE [COMMAND]`

Starts a container from an image.

```bash
docker run -it ubuntu bash                       # interactive shell
docker run -d --name web -p 8080:80 nginx        # background, named, with port binding
docker run --rm -v $(PWD):/app python:3.9 python script.py  # ephemeral, with bind mount
```

Key flags:

- `-d` — detached (background)
- `-it` — interactive + pseudo-TTY (for debugging sessions)
- `--rm` — auto-remove the container after it exits; without this, Docker leaves behind stopped containers
- `-v` — volume or bind mount
- `-p` — publish port: `-p <host_port>:<container_port>`
- `--name` — assign a name to the container

### Practical Example: Apache Container

```bash
docker pull httpd
docker run -d --name my-apache -p 8080:80 httpd
docker ps  # verify it's running
```

Open `http://localhost:8080` in a browser to see the default page. To modify it:

```bash
docker exec -it my-apache bash
echo "<h1>Hello from Docker</h1>" > /usr/local/apache2/htdocs/index.html
```

## 3. List, Stop & Remove Containers

```bash
docker ps          # show running containers
docker ps -a       # all containers, including stopped ones
```

```bash
docker start <container_id>
docker restart <container_id>
docker stop <container_id>
docker rm <container_id>        # remove a stopped container
docker rm -f <container_id>     # force-remove a running container
```

Batch cleanup:

```bash
docker stop $(docker ps -aq)              # stop all containers
docker rm $(docker ps -aq)               # remove all stopped containers
docker rm -f $(docker ps -aq)            # force-remove everything
docker rmi $(docker images -q)           # remove all images
```

## 4. List & Remove Images

```bash
docker images                 # list all local images
docker rmi <image_id>         # remove a specific image
docker image prune            # remove only dangling (untagged, unused) images
docker image prune -a         # remove all unused images, even tagged ones
```

The distinction matters: `prune` removes only dangling images; `prune -a` removes everything not currently used by a container. Use `-f` to force-remove images that are still in use.

## 5. Volumes

Volumes are the preferred way to persist data between container restarts and share data between containers.

```bash
docker volume create volume007
docker volume ls
docker volume inspect volume007
docker volume rm volume007
docker run -v my_volume:/data ubuntu ls /data   # check volume contents
```

## 6. Inspect & Debug

```bash
docker inspect <container_or_image>   # full JSON metadata (network, mounts, env)
docker logs <container>               # stdout/stderr from container
docker logs -f <container>            # follow logs in real time
docker exec -it <container> bash      # open shell inside running container
```

`exec` requires the container to be running. Start it first if it's stopped, then exec in.

## 7. Clean Up Resources

```bash
docker system prune -af   # remove all unused containers, images, networks, build cache
docker volume prune       # remove unused volumes
```

Useful when disk space fills up. Use carefully — this is not easily reversible.

## 8. Save / Load / Push / Pull

Save and load images locally (useful for air-gapped environments):

```bash
docker save -o my_app.tar my_app:latest
docker load -i my_app.tar
```

Push and pull from a registry (ECR example):

```bash
docker tag my_app:latest 993750298572.dkr.ecr.us-west-2.amazonaws.com/my_app:v1
docker push 993750298572.dkr.ecr.us-west-2.amazonaws.com/my_app:v1
docker pull 993750298572.dkr.ecr.us-west-2.amazonaws.com/my_app:v1
```

## 9. Docker Compose

For multi-container setups (API + database + cache, etc.), Compose handles them together:

```bash
docker compose up -d    # start all services defined in docker-compose.yml
docker compose down     # stop and remove containers + default network
docker compose ps       # list running services
```

## 10. Check What's Running and Using Space

```bash
docker ps                 # running containers
docker stats              # live CPU / memory per container
docker system df          # breakdown of disk usage by images, containers, volumes
```

## Summary Cheat Sheet

| Category | Command | Purpose |
|---|---|---|
| **Build** | `docker build -t my_app .` | Build image from Dockerfile |
| **Run** | `docker run -d -p 8080:80 my_app` | Start container |
| **List** | `docker ps -a` | See all containers |
| **Logs** | `docker logs -f my_app` | Stream output |
| **Inspect** | `docker inspect my_app` | Full metadata |
| **Exec** | `docker exec -it my_app bash` | Shell inside container |
| **Stop/Remove** | `docker stop my_app && docker rm my_app` | Clean up |
| **Volumes** | `docker volume ls` | Manage volumes |
| **Clean** | `docker system prune -af` | Remove all unused resources |
| **Push/Pull** | `docker push / docker pull` | Share via registry |
