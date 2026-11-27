# GitHub, GHCR and AWS EC2 deployment — step by step

This project is configured so that pushing to the `main` branch triggers the pipeline. GitHub Actions builds **both** Docker images, publishes them to GHCR, and updates the EC2 application.

## 1. Create the GitHub repository
1. Sign in at https://github.com.
2. Click **+** (top-right) → **New repository**.
3. Repository name: `devops-task-manager`.
4. Choose **Public** (the submission guideline asks for a repository accessible to evaluators).
5. Do not initialize with a README, `.gitignore`, or license (this project already contains them).
6. Click **Create repository**. Keep the repository page open.

## 2. Upload this project to GitHub (browser method)
1. Extract `devops-task-manager.zip` on your computer.
2. Open the newly created empty GitHub repository.
3. Click **Add file** → **Upload files**.
4. Open the extracted project folder and select **all its contents**, including the hidden `.github` folder. Do not upload only the outer ZIP.
5. Drag the files/folders into the GitHub upload area.
6. Enter commit message `Add full-stack DevOps task manager`.
7. Click **Commit changes**.
8. Open the repository's **Code** tab and confirm that `frontend`, `backend`, `.github`, `docker-compose.yml`, and `DEPLOYMENT.md` are visible.

> If the browser upload does not show the hidden `.github` folder, use the Git commands below instead.

### Alternative: upload using Git
Install Git, open a terminal in the extracted project folder, and run:

```bash
git init
git add .
git commit -m "Initial DevOps task manager"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/devops-task-manager.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username. If Git asks you to authenticate, complete the browser sign-in or use GitHub's supported authentication flow. Do not put a password or token in the remote URL.

## 3. Create an AWS EC2 instance
1. Sign in to https://console.aws.amazon.com/ and open **EC2**.
2. Choose **Launch instance**.
3. Name it `devops-task-manager`.
4. Select Ubuntu Server 24.04 LTS (64-bit x86) or another supported Ubuntu LTS image.
5. Choose an instance type suitable for a small demo (for example, `t3.micro` where available and eligible).
6. Create or select a key pair. Download the `.pem` file and keep it private. **Never upload it to GitHub.**
7. In **Network settings**, create/select a security group with:
   - SSH TCP 22: **My IP** only (recommended).
   - HTTP TCP 80: `0.0.0.0/0`.
   - Do not open backend port 5000 publicly; Nginx proxies API requests internally.
8. Launch the instance.
9. In EC2 → Instances, wait for **Instance state: Running** and copy its **Public IPv4 address**.

## 4. Install Docker on EC2
Connect to the instance from your computer (replace paths and address):

```bash
chmod 400 /path/to/your-key.pem
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

On the EC2 terminal, install Docker and the Compose plugin:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Disconnect and reconnect so the Docker group membership takes effect:

```bash
exit
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
docker --version
docker compose version
```

## 5. Create a GitHub Actions SSH key
This is separate from your original EC2 key pair and is used by GitHub Actions to connect to EC2.

On your own computer (not on GitHub), run:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f github_actions_ec2
```

When prompted for a passphrase, press Enter twice to create a key without a passphrase (protect the private key carefully). This creates:
- `github_actions_ec2` — private key; keep secret.
- `github_actions_ec2.pub` — public key.

Add the public key to EC2's authorized keys. Connect to EC2 using your original EC2 key, then run:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

Paste the entire one-line contents of `github_actions_ec2.pub` on a new line. Save (`Ctrl+O`, Enter) and exit (`Ctrl+X`), then run:

```bash
chmod 600 ~/.ssh/authorized_keys
```

## 6. Create a GHCR read token for EC2
The workflow publishes images using the built-in `GITHUB_TOKEN`. EC2 needs a separate GitHub Personal Access Token (classic) with `read:packages` permission to pull private packages.

1. In GitHub, click your profile → **Settings**.
2. Open **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
3. Generate a new token. Give it a descriptive name and an expiry.
4. Select only `read:packages` (and any additional permission GitHub explicitly requires for your account/package visibility).
5. Generate and copy it once. Store it securely. Do not commit it.

If you make both GHCR packages public after the first successful push, the EC2 token may not be needed for public pulls; this guide keeps authentication configured for reliability.

## 7. Add repository secrets
In the GitHub repository:
1. Open **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** for each item below.

| Secret name | Value |
|---|---|
| `EC2_HOST` | EC2 Public IPv4 address |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Entire contents of private file `github_actions_ec2` (include BEGIN/END lines) |
| `GHCR_USERNAME` | Your GitHub username |
| `GHCR_TOKEN` | Personal Access Token with `read:packages` |

Do not add quotes around secret values. Never share the private key or token in chat, source files, or commits.

## 8. Enable GitHub Actions permissions
1. Repository → **Settings** → **Actions** → **General**.
2. Under **Workflow permissions**, select **Read and write permissions**.
3. Save. This permits the workflow's `GITHUB_TOKEN` to publish packages to GHCR.

## 9. Run the pipeline
1. Open the repository's **Actions** tab.
2. Select **Build, publish and deploy**.
3. If it has not started, make a small README edit and commit it to `main`.
4. Open the running workflow and inspect each step. Wait for the green check mark.
5. The workflow publishes:
   - `ghcr.io/YOUR_GITHUB_USERNAME/devops-task-manager-frontend:latest`
   - `ghcr.io/YOUR_GITHUB_USERNAME/devops-task-manager-backend:latest`
6. In GitHub, open your profile → **Packages** and confirm both packages exist. If they are private and evaluators need to inspect them, change package visibility to Public only after reviewing your organization's security requirements.

## 10. Verify the deployment
Open these URLs in a browser (replace the IP):
- Frontend: `http://YOUR_EC2_PUBLIC_IP`
- Backend health through the frontend proxy: `http://YOUR_EC2_PUBLIC_IP/api/health`
- Tasks API: `http://YOUR_EC2_PUBLIC_IP/api/tasks`

The frontend should load, show sample tasks, allow adding/toggling/deleting tasks, and show API connectivity. The health endpoint should return JSON with `"status":"ok"`.

On EC2, useful checks:

```bash
docker compose -f /opt/devops-task-manager/docker-compose.yml ps
docker logs task-manager-backend
docker logs task-manager-frontend
```

## 11. What to submit
Fill in the actual values after deployment:

| Submission item | Your value |
|---|---|
| Project Name | DevOps Task Manager |
| GitHub Repository | `https://github.com/YOUR_GITHUB_USERNAME/devops-task-manager` |
| Frontend URL | `http://YOUR_EC2_PUBLIC_IP` |
| Backend API URL | `http://YOUR_EC2_PUBLIC_IP/api/health` |
| CI/CD Status | Successful GitHub Actions run (link to run) |

## Troubleshooting
- **Workflow says permission denied when pushing to GHCR:** confirm Actions workflow permissions are Read and write; confirm package naming and login step.
- **SSH action cannot connect:** confirm EC2 security group allows TCP 22 from the GitHub-hosted runner (for a learning demo, temporary `0.0.0.0/0` may be needed; restrict it again afterward), `EC2_HOST`, `EC2_USER`, and the private key secret are correct.
- **Docker pull denied:** confirm `GHCR_USERNAME` and `GHCR_TOKEN` are correct and token has `read:packages`; confirm the packages are accessible to that account.
- **Site does not open:** confirm inbound TCP 80 is allowed and `docker compose ps` shows both containers running.
- **API returns 502:** check `docker logs task-manager-backend`; confirm both services are on the Compose network and backend listens on `0.0.0.0:5000`.

## Security reminders
- Restrict SSH ingress to trusted IP addresses wherever possible.
- Use GitHub Secrets for credentials. Never commit `.pem`, private SSH keys, personal access tokens, or cloud credentials.
- Rotate/revoke tokens if they are exposed.
