# DEVOPS.md

Full-stack deployment of a Django 6.0 (REST API) + React (Vite, TypeScript) app.

- **Deployed URL:** http://3.26.230.226
- **Repo:** https://github.com/ishankhan-866/devops-assesment-
- Screenshot of the running app: `screenshot.png`

## 1. Architecture

```
Browser ──► frontend container (nginx, port 80)
              ├─ /           → React static files
              ├─ /api/       → proxy → backend:8000 (Django + gunicorn)
              └─ /admin/     → proxy → backend:8000
backend container ──► db container (PostgreSQL 16, named volume)

git push (main) ──► CI/CD ──► build images ──► Docker Hub ──► SSH deploy to EC2
```

Only the frontend publishes a port to the host (80). The backend and database
are reachable only inside the Docker network.

## 2. Setup guide: run locally

Requirements: Docker (with Compose v2) and Git.

```bash
git clone https://github.com/ishankhan-866/devops-assesment-.git
cd devops-assesment-
cp .env.example .env
```

Open `.env` and fill the values (it contains key names only, no secrets are committed):

| Variable | Example |
|---|---|
| DJANGO_SECRET_KEY | any long random string |
| DJANGO_DEBUG | False (True for local debugging) |
| DJANGO_ALLOWED_HOSTS | localhost,127.0.0.1 |
| DJANGO_CSRF_TRUSTED_ORIGINS | http://localhost |
| DB_NAME / POSTGRES_DB | appdb (both the same) |
| DB_USER / POSTGRES_USER | appuser (both the same) |
| DB_PASSWORD / POSTGRES_PASSWORD | a strong password (both the same) |
| DB_HOST | db |
| DB_PORT | 5432 |

Start everything:

```bash
docker compose up -d --build
docker compose ps
```

Open http://localhost. Stop with `docker compose down` (add `-v` to also delete the database volume). Logs: `docker compose logs -f backend`.

## 3. Setup guide: run on the server (AWS EC2, Ubuntu)

1. Launch an Ubuntu EC2 instance. Security group inbound rules: 22, 80, 443 only (the Terraform file in `terraform/` defines exactly this).
2. Connect by SSH (or EC2 Instance Connect) and install the tools:
   ```bash
   apt-get update -y
   apt-get install -y docker.io git
   mkdir -p /usr/local/lib/docker/cli-plugins
   curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
   chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
   ```
3. Clone and configure:
   ```bash
   git clone https://github.com/ishankhan-866/devops-assesment-.git
   cd devops-assesment-
   cp .env.example .env
   nano .env     # set DJANGO_ALLOWED_HOSTS=<server-ip>,localhost and DJANGO_CSRF_TRUSTED_ORIGINS=http://<server-ip>
   ```
4. Start: `docker compose up -d --build`, then open `http://<server-ip>`.

Note: a normal EC2 public IP changes if the instance is stopped and started. Use an Elastic IP for a permanent address.

## 4. CI/CD

**GitHub Actions** (`.github/workflows/deploy.yml`), triggered on every push to `main`:

1. Build the backend and frontend images.
2. Push both to Docker Hub (`devops-backend`, `devops-frontend`, tagged `latest` and the commit SHA).
3. SSH into the EC2 server, `git pull`, and run `docker compose up -d --build`.

Repository secrets required (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| DOCKERHUB_USERNAME | Docker Hub username |
| DOCKERHUB_TOKEN | Docker Hub access token |
| EC2_HOST | server public IP |
| EC2_SSH_KEY | private key of a dedicated deploy key pair (public half is in the server's `~/.ssh/authorized_keys`) |

**Jenkins** (`Jenkinsfile`): same three stages (build, push, deploy). Setup: install Jenkins on a machine with Docker, add the `jenkins` user to the `docker` group, add credentials `dockerhub-creds` (username + token) and `ec2-ssh` (SSH key), create a Pipeline job from SCM on branch `main`, and add a GitHub webhook to `http://<jenkins-host>:8080/github-webhook/`.

## 5. Infrastructure as Code (Terraform)

`terraform/main.tf` provisions an Ubuntu EC2 instance with Docker installed and a security group allowing only ports 22, 80 and 443.

```bash
cd terraform
terraform init
terraform apply -var="key_name=<your-keypair-name>"
```

## 6. Security measures

- Backend and frontend containers run as non-root users (`appuser`, `nginx`).
- Multi-stage builds; `.dockerignore` files exclude junk and local files.
- `.env`, `venv/` and `db.sqlite3` are git-ignored; `.env.example` has key names only.
- Pipeline credentials are stored as GitHub/Jenkins secrets, never in code.
- Firewall allows only 22, 80, 443; database and backend ports are not published.
- Known limitation: an earlier commit contained `.env`, so the old values remain in git history. Rotate `DJANGO_SECRET_KEY` and the database password before real use.

## 7. Troubleshooting log

**1. Frontend build failed: `npm error ENOENT ... /app/package.json`**
- Cause: `docker-compose.yml` builds the frontend with the repo root as context (so it can copy `nginx/default.conf`), but the Dockerfile copied `package*.json` from the root, while the files live in `frontend/`.
- Fix: changed the Dockerfile to `COPY frontend/package*.json ./` and `COPY frontend/ .`, then rebuilt.

**2. App not reachable from the browser (page kept loading)**
- Cause: the EC2 security group did not allow inbound HTTP on port 80.
- Fix: added an inbound rule (HTTP, port 80, 0.0.0.0/0).

**3. `git push` from the server failed with 403**
- Cause: the personal access token did not have the `repo` scope.
- Fix: generated a new classic token with `repo` and `workflow` scopes.

**4. Secrets and junk committed to the repository**
- Cause: no `.gitignore`; `.env`, `backend/venv` and `db.sqlite3` were tracked.
- Fix: added `.gitignore`, ran `git rm -r --cached` on those paths, and added `.env.example` with key names only.

**5. Containers ran as root**
- Cause: single-stage backend Dockerfile and `nginx:alpine` both run as root by default.
- Fix: multi-stage backend image with a dedicated `appuser`; frontend switched to `nginxinc/nginx-unprivileged` on port 8080 (published as 80:8080).
