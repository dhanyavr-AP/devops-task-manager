# DevOps Task Manager

A small full-stack task manager built to satisfy the Faculty Internship Program DevOps submission guidelines.

## Stack
- Frontend: React + Vite, served by Nginx
- Backend: Node.js + Express REST API (in-memory sample data; no database)
- Containers: Docker + Docker Compose
- CI/CD: GitHub Actions builds and pushes both images to GitHub Container Registry (GHCR), then deploys to AWS EC2 over SSH.

## Run locally
Requirements: Docker and Docker Compose plugin.

```bash
docker compose up --build
```
Open http://localhost. The frontend calls the backend through Nginx at `/api`.
Health endpoint: http://localhost/api/health

Stop:
```bash
docker compose down
```

## GitHub / GHCR / EC2 deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete click-by-click setup, GitHub upload, secrets, EC2 preparation, and verification steps.

## Project structure
```text
devops-task-manager/
├── frontend/                 # React UI + Nginx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── backend/                  # Express API
│   └── Dockerfile
├── .github/workflows/
│   └── ci-cd.yml
├── docker-compose.yml
└── DEPLOYMENT.md
```

## API
- `GET /api/health` — health check
- `GET /api/tasks` — list tasks
- `POST /api/tasks` — create a task (`{"title":"Prepare submission"}`)
- `PATCH /api/tasks/:id` — toggle completion
- `DELETE /api/tasks/:id` — delete a task

Tasks are stored in memory and reset when the backend container is recreated. This is intentional: the assignment says a database is not required.

## Important
Never commit passwords, private keys, tokens, or `.env` files. Configure deployment credentials as GitHub Actions repository secrets.
