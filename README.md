# DevOps Assessment: Full-Stack Deployment

Django 6.0 (REST API) + React (Vite, TypeScript) + PostgreSQL, containerized with Docker Compose, deployed to AWS EC2 with an automated CI/CD pipeline.

- **Live:** http://3.26.230.226
- **Full documentation:** see [DEVOPS.md](DEVOPS.md) (setup guide, CI/CD, Terraform, troubleshooting log)

![App running on EC2](screenshot.png)

## Repository layout

```
backend/                  Django app + Dockerfile (multi-stage, non-root) + .dockerignore
frontend/                 React app + Dockerfile (multi-stage, non-root nginx) + .dockerignore
nginx/default.conf        nginx config (static files + /api and /admin proxy)
docker-compose.yml        db + backend + frontend
.github/workflows/        CI/CD: build, push to Docker Hub, deploy to EC2
Jenkinsfile               Equivalent Jenkins pipeline
terraform/main.tf         EC2 + security group (22, 80, 443 only)
.env.example              Configuration keys (no secrets)
DEVOPS.md                 Setup guide + troubleshooting log
```

## Quick start

```bash
cp .env.example .env     # fill in the values
docker compose up -d --build
```

Open http://localhost

## Assumptions

1. Registry is Docker Hub (public); images are `<user>/devops-backend` and `<user>/devops-frontend`.
2. The assessment mentions both Jenkins and `.github/workflows/`. The pipeline verified end to end on every push to `main` is GitHub Actions; a `Jenkinsfile` with the same stages is included and documented, but it was not run against a Jenkins server for this submission.
3. The EC2 instance used for the live deployment was created manually in the AWS console (Ubuntu, ports 22/80/443 open). The Terraform code in `terraform/` defines the same setup but was not applied to create this instance.
4. Deployment on the server is `git pull` + `docker compose up -d --build`; Docker Hub images are built and published by the pipeline.
5. TLS (443) is allowed in the firewall but no certificate is configured; the site is served over HTTP.
6. The server's public IP is not an Elastic IP, so it can change if the instance is stopped and started.
7. Secrets live only in the server's `.env` and in GitHub/Jenkins secrets. An earlier commit contained `.env`, so those values should be rotated (noted in DEVOPS.md).
