# Deployment Guide - AWYAD MES (Staging)

> **Staging URL:** https://awyad.3bs.ltd
> **VPS OS:** Ubuntu 24.04.4 LTS
> **Already on VPS:** Docker, Nginx (host), Certbot
> **Stack:** Docker container + dedicated Postgres container + host Nginx reverse proxy

---

## Overview

Run these 10 steps **in order**, top to bottom. Each step depends on the previous one.

```
Step 1  SSH into VPS
Step 2  Clone the repo
Step 3  Create Docker network
Step 4  Start the database container
Step 5  Configure .env
Step 6  Build and start the app container
Step 7  Initialize the database
Step 8  Configure Nginx
Step 9  Point DNS and get SSL certificate
Step 10 Verify everything works
```

---

## Step 1 — SSH into the VPS

```bash
ssh your-user@<VPS-IP>
```

---

## Step 2 — Clone the Repository

Create the app directory and clone the code. This must come first because the
Docker image is built from this source code.

```bash
sudo mkdir -p /opt/awyad-mes
sudo chown $USER:$USER /opt/awyad-mes

git clone https://github.com/3bsolutionsltd/-awyad-mes-demo.git /opt/awyad-mes
cd /opt/awyad-mes
```

---

## Step 3 — Create the Docker Network

Create an isolated network for AWYAD MES. This must happen before starting any
containers, because both the database and app containers attach to it.

All existing VPS networks are owned by other projects and must not be touched:

| Existing network | Owner |
|-----------------|-------|
| `amis-staging_default` | AMIS |
| `tc_staging_network` | TC |
| `schoolbox_schoolbox_net` | Schoolbox |
| `opf-cd_opfcd-network` | OPFCD |

```bash
docker network create awyad-net
```

---

## Step 4 — Start the Database Container

Start a dedicated Postgres container on `awyad-net`. It does not share storage or
network with the three existing Postgres containers on this VPS
(`amis-staging-db-1`, `tc_postgres_staging`, `schoolbox-db`).

```bash
docker run -d \
  --name awyad-mes-db \
  --restart unless-stopped \
  --network awyad-net \
  -e POSTGRES_USER=awyad_user \
  -e POSTGRES_PASSWORD='<STRONG_DB_PASSWORD>' \
  -e POSTGRES_DB=awyad_mes \
  -v awyad-mes-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

Replace `<STRONG_DB_PASSWORD>` with your password **inside the single quotes** — do not
remove the single quotes. They prevent bash from misinterpreting special characters
like `!`, `$`, and `&`. Avoid using `'` (single quote) in the password itself.

Verify it is running:

```bash
docker ps --filter name=awyad-mes-db
# STATUS column should say "Up"
```

> The named volume `awyad-mes-pgdata` persists data across restarts and image rebuilds.

---

## Step 5 — Configure Environment Variables

```bash
cd /opt/awyad-mes
cp .env.example .env
nano .env
```

Replace the entire file contents with the following, filling in your values
where indicated:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Storage — use PostgreSQL
USE_DATABASE=true

# Database — container name works as hostname because both containers share awyad-net
DB_HOST=awyad-mes-db
DB_PORT=5432
DB_NAME=awyad_mes
DB_USER=awyad_user
DB_PASSWORD=<STRONG_DB_PASSWORD>
DB_POOL_SIZE=20

# JWT — generate a secret with the command below, then paste it here
JWT_SECRET=<64-char-random-hex>
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# API
API_BASE_URL=/api/v1
MAX_REQUEST_SIZE=10mb

# CORS
CORS_ORIGIN=https://awyad.3bs.ltd

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

Generate the JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as the value of `JWT_SECRET` in `.env`.

Lock the file so only your user can read it:

```bash
chmod 600 /opt/awyad-mes/.env
```

---

## Step 6 — Build and Start the App Container

Build the Docker image from the cloned source code, then run it.
Port 3001 on the host is confirmed free on this VPS.

```bash
cd /opt/awyad-mes

# Build the image (takes 1-2 minutes on first run)
docker build -t awyad-mes:latest .

# Run the container
docker run -d \
  --name awyad-mes \
  --restart unless-stopped \
  --network awyad-net \
  --env-file /opt/awyad-mes/.env \
  -p 127.0.0.1:3001:3000 \
  awyad-mes:latest
```

`-p 127.0.0.1:3001:3000` binds port 3001 to localhost only — it is never directly
reachable from the internet. Nginx will proxy it in Step 8.

Verify it started:

```bash
docker ps --filter name=awyad-mes
docker logs awyad-mes --tail 30
```

You should see `Server running at http://0.0.0.0:3000` in the logs.

---

## Step 7 — Initialize the Database

Run these commands inside the running app container. They create the schema,
seed the initial data, and verify the result.

```bash
# Create all tables and seed initial admin user
docker exec -it awyad-mes node database/setup.js

# Apply any pending migrations
docker exec -it awyad-mes node database/migrate.js

# Confirm tables and seed data look correct
docker exec -it awyad-mes node database/setup.js verify
```

Default admin credentials created by setup:
- **Email:** admin@awyad.org
- **Password:** Admin@123

> **Change this password immediately after first login.**

Quick smoke test:

```bash
curl http://127.0.0.1:3001/api/v1/health
# Should return: {"success":true,"message":"API is running",...}
```

---

## Step 8 — Configure Nginx

Add a new server block for `awyad.3bs.ltd`. Do **not** edit any existing config files.

```bash
sudo nano /etc/nginx/sites-available/awyad-mes
```

Paste this exactly:

```nginx
server {
    listen 80;
    server_name awyad.3bs.ltd;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10m;
    }
}
```

Enable the site and reload:

```bash
sudo ln -s /etc/nginx/sites-available/awyad-mes /etc/nginx/sites-enabled/
sudo nginx -t
# Must print: syntax is ok / test is successful
sudo systemctl reload nginx
```

---

## Step 9 — DNS and SSL

### 9a. Add DNS A Record

In your DNS provider (wherever `3bs.ltd` is managed), add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `awyad` | `<VPS-IP>` | 300 |

Wait for propagation (usually a few minutes). Test it:

```bash
curl -I http://awyad.3bs.ltd
# Should return HTTP/1.1 200 OK (not a connection error)
```

### 9b. Issue SSL Certificate

Certbot is already installed. This only affects `awyad.3bs.ltd` — existing
certificates for other domains are not touched.

```bash
sudo certbot --nginx -d awyad.3bs.ltd
```

Certbot automatically updates the Nginx config with the HTTPS block and HTTP redirect.
Reload to apply:

```bash
sudo systemctl reload nginx
```

Test renewal works:

```bash
sudo certbot renew --dry-run
```

---

## Step 10 — Final Verification

```bash
# App container running
docker ps --filter name=awyad-mes

# DB container running
docker ps --filter name=awyad-mes-db

# API health over localhost
curl http://127.0.0.1:3001/api/v1/health

# API health over HTTPS (end-to-end test)
curl https://awyad.3bs.ltd/api/v1/health
```

Then open https://awyad.3bs.ltd in a browser and log in with admin@awyad.org / Admin@123.
**Change the password immediately.**

---

## Deploying Code Updates

```bash
cd /opt/awyad-mes
git pull origin main

docker build -t awyad-mes:latest .
docker stop awyad-mes && docker rm awyad-mes

docker run -d \
  --name awyad-mes \
  --restart unless-stopped \
  --network awyad-net \
  --env-file /opt/awyad-mes/.env \
  -p 127.0.0.1:3001:3000 \
  awyad-mes:latest

docker exec -it awyad-mes node database/migrate.js
docker logs awyad-mes --tail 30
```

---

## Maintenance Commands

| Task | Command |
|------|---------|
| View app logs (live) | `docker logs awyad-mes -f` |
| Restart app | `docker restart awyad-mes` |
| Open shell in container | `docker exec -it awyad-mes sh` |
| Run DB migrations | `docker exec -it awyad-mes node database/migrate.js` |
| View Nginx error log | `sudo tail -f /var/log/nginx/error.log` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Renew all SSL certs | `sudo certbot renew` |

---

## Troubleshooting

| Symptom | What to check |
|---------|--------------|
| `502 Bad Gateway` | `docker ps` — is `awyad-mes` running? Check `docker logs awyad-mes` |
| Container exits immediately | `docker logs awyad-mes` — usually a missing or wrong `.env` value |
| DB connection refused | Confirm both containers are on `awyad-net`: `docker network inspect awyad-net` |
| `setup.js` fails | Confirm Step 4 ran first and `awyad-mes-db` is healthy |
| Certbot fails | DNS must resolve before running certbot — confirm with `curl -I http://awyad.3bs.ltd` first |

---

## Security Checklist

- [ ] Container runs as non-root user (already enforced by the Dockerfile)
- [ ] Port 3001 bound to `127.0.0.1` only — not reachable from the internet
- [ ] `.env` permissions are `600` — only your user can read it
- [ ] Default admin password changed after first login
- [ ] `JWT_SECRET` is a unique 64-char random hex string
- [ ] `CORS_ORIGIN` is `https://awyad.3bs.ltd` — not `*`
- [ ] HTTPS active and HTTP redirects to HTTPS
