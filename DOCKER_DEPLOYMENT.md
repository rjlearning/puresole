# 🐳 PureSoul - Docker Deployment Guide

## Complete Docker Desktop Setup for Production

**Date:** February 10, 2026
**Status:** ✅ **PRODUCTION READY**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Scaling](#scaling)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Production Best Practices](#production-best-practices)

---

## ✅ Prerequisites

### 1. Install Docker Desktop

**macOS:**
```bash
# Download from: https://www.docker.com/products/docker-desktop

# Or install with Homebrew
brew install --cask docker
```

**Windows:**
- Download from: https://www.docker.com/products/docker-desktop
- Requires WSL 2

**Linux:**
```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Verify Installation

```bash
# Check Docker version
docker --version
# Expected: Docker version 24.x.x or higher

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 2.x.x or higher

# Test Docker
docker run hello-world
```

---

## 🚀 Quick Start

### 1. Copy Project to Your Laptop

```bash
# From your Downloads folder or wherever you want
cd ~/Projects  # or your preferred location

# Copy the PureSoul folder
# (It's already in your workspace: /sessions/exciting-wizardly-goldberg/mnt/PureSoul)
```

### 2. Configure Environment Variables

```bash
cd PureSoul

# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
# Strong passwords (generate with: openssl rand -base64 32)
POSTGRES_PASSWORD=your_strong_password
REDIS_PASSWORD=your_redis_password
SESSION_SECRET=your_session_secret

# OpenAI API Key (for Phase IV insights)
OPENAI_API_KEY=sk-your-actual-openai-key
```

### 3. Start Everything

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access the Application

Open your browser: **http://localhost:4000**

**Done!** 🎉 Everything is running in Docker!

---

## ⚙️ Configuration

### Docker Compose Services

The `docker-compose.yml` orchestrates 3 services:

#### 1. **postgres** - PostgreSQL Database
- **Image:** `postgres:16-alpine`
- **Port:** 5432
- **Data:** Persisted in `postgres_data` volume
- **Migrations:** Auto-run on first start

#### 2. **redis** - Cache Layer
- **Image:** `redis:7-alpine`
- **Port:** 6379
- **Data:** Persisted in `redis_data` volume
- **Purpose:** Session storage, caching

#### 3. **app** - PureSoul Application
- **Build:** Custom Dockerfile (multi-stage)
- **Port:** 4000
- **Depends on:** postgres, redis
- **Includes:** All Phase IV features

### Environment Variables Reference

```env
# === Database ===
POSTGRES_PASSWORD=strong_password_here
DATABASE_URL=postgresql://puresoul:password@postgres:5432/puresoul

# === Redis ===
REDIS_PASSWORD=redis_password_here
REDIS_URL=redis://:password@redis:6379

# === Application ===
NODE_ENV=production
PORT=4000
APP_URL=http://localhost:4000

# === Security ===
SESSION_SECRET=generate_random_64_char_string

# === OpenAI (Phase IV) ===
OPENAI_API_KEY=sk-your-key-here

# === Optional: Stripe ===
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# === Optional: Email ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🚢 Deployment

### Development Mode

```bash
# Start with logs visible
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data!)
docker-compose down -v
```

### Production Deployment

#### 1. Build for Production

```bash
# Build optimized images
docker-compose build --no-cache

# Tag for production
docker tag puresoul-app:latest puresoul-app:v1.0.0
```

#### 2. Push to Registry (Optional)

```bash
# Docker Hub
docker login
docker tag puresoul-app:latest your-username/puresoul:v1.0.0
docker push your-username/puresoul:v1.0.0

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag puresoul-app:latest your-account.dkr.ecr.us-east-1.amazonaws.com/puresoul:v1.0.0
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/puresoul:v1.0.0
```

#### 3. Deploy to Server

```bash
# On your production server
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📈 Scaling

### Horizontal Scaling

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    deploy:
      replicas: 3  # Run 3 instances
      restart_policy:
        condition: on-failure
        max_attempts: 3
    environment:
      NODE_ENV: production

  # Add Nginx load balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - puresoul-network
```

**Start scaled deployment:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale app=3
```

### Vertical Scaling

Limit resources in `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 app
```

### Check Container Health

```bash
# Status of all containers
docker-compose ps

# Detailed stats
docker stats

# Health check
docker inspect puresoul-app | grep Health -A 10
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U puresoul -d puresoul

# Common queries
docker-compose exec postgres psql -U puresoul -d puresoul -c "\dt"
docker-compose exec postgres psql -U puresoul -d puresoul -c "SELECT COUNT(*) FROM voice_recordings;"
```

### Redis Access

```bash
# Connect to Redis
docker-compose exec redis redis-cli -a your_redis_password

# Check keys
docker-compose exec redis redis-cli -a your_redis_password KEYS "*"
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find what's using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "4001:4000"
```

#### 2. Database Connection Failed

```bash
# Check if postgres is healthy
docker-compose ps postgres

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Check connection
docker-compose exec app node -e "const pg = require('pg'); const client = new pg.Client(process.env.DATABASE_URL); client.connect().then(() => console.log('Connected!')).catch(console.error)"
```

#### 3. Build Fails

```bash
# Clean build
docker-compose down
docker system prune -a
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test .
```

#### 4. Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Remove specific volumes
docker volume rm puresoul_postgres_data
```

#### 5. Migrations Not Running

```bash
# Run migrations manually
docker-compose exec app node -e "require('./server/db/migrations/runMigrations')"

# Or exec into container
docker-compose exec app sh
cd server/db/migrations
node runPhase4Migration.cjs
```

---

## 🔒 Production Best Practices

### 1. Security

```bash
# Use secrets instead of env vars
docker secret create postgres_password ./postgres_password.txt
docker secret create openai_key ./openai_key.txt

# Update docker-compose.yml
secrets:
  postgres_password:
    external: true
  openai_key:
    external: true
```

### 2. SSL/TLS

Add Nginx reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://app:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Backups

```bash
# Backup postgres
docker-compose exec postgres pg_dump -U puresoul puresoul > backup_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v puresoul_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore
docker run --rm -v puresoul_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

### 4. Auto-restart on Crash

Already configured in `docker-compose.yml`:
```yaml
restart: unless-stopped
```

### 5. Health Checks

Monitor application health:

```bash
# Check health endpoint
curl http://localhost:4000/health

# Automated health monitoring
while true; do
  curl -f http://localhost:4000/health || echo "Health check failed"
  sleep 30
done
```

---

## 🎯 Common Commands Cheat Sheet

```bash
# === Start/Stop ===
docker-compose up -d                 # Start in background
docker-compose down                  # Stop all services
docker-compose restart               # Restart all services
docker-compose restart app           # Restart specific service

# === Logs ===
docker-compose logs -f               # Follow all logs
docker-compose logs -f app           # Follow app logs
docker-compose logs --tail=100 app   # Last 100 lines

# === Status ===
docker-compose ps                    # List containers
docker-compose top                   # Show running processes
docker stats                         # Resource usage

# === Exec ===
docker-compose exec app sh           # Shell into app container
docker-compose exec postgres psql -U puresoul -d puresoul
docker-compose exec redis redis-cli -a password

# === Rebuild ===
docker-compose build                 # Rebuild images
docker-compose up -d --build         # Rebuild and restart
docker-compose build --no-cache app  # Force rebuild app

# === Clean ===
docker-compose down -v               # Stop and remove volumes
docker system prune -a               # Remove all unused images
docker volume prune                  # Remove unused volumes

# === Scale ===
docker-compose up -d --scale app=3   # Run 3 app instances

# === Update ===
docker-compose pull                  # Pull latest images
docker-compose up -d --build         # Rebuild and restart
```

---

## 📦 Deployment Checklist

### Pre-deployment

- [ ] All environment variables configured
- [ ] `.env` file created with production values
- [ ] Strong passwords generated
- [ ] OpenAI API key added
- [ ] Docker Desktop installed and running
- [ ] Sufficient disk space (10GB+ recommended)

### Deployment

- [ ] `docker-compose build` successful
- [ ] `docker-compose up -d` started all services
- [ ] Health checks passing (`docker-compose ps`)
- [ ] Database migrations completed
- [ ] Application accessible at http://localhost:4000
- [ ] Can login/register
- [ ] Analytics page loads
- [ ] Phase IV features working

### Post-deployment

- [ ] Backups configured
- [ ] Monitoring setup
- [ ] SSL certificate (if production)
- [ ] Domain configured (if production)
- [ ] Load balancer configured (if scaling)

---

## 🎉 Benefits of Docker Deployment

✅ **One Command Start:** `docker-compose up -d`
✅ **No Dependency Hell:** Everything packaged
✅ **Consistent Environments:** Dev = Staging = Prod
✅ **Easy Scaling:** `--scale app=3`
✅ **Quick Rollbacks:** Version-tagged images
✅ **Resource Isolation:** Containers are sandboxed
✅ **Simple Cleanup:** `docker-compose down`
✅ **Production Ready:** Multi-stage optimized builds

---

## 📞 Support

**Documentation:**
- Docker: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose

**PureSoul Docs:**
- `/PHASE4_COMPLETE.md` - Feature overview
- `/PHASE4_DEPLOYMENT_GUIDE.md` - Detailed deployment
- `/UI_IMPROVEMENTS_SUMMARY.md` - UI changes

---

**Created:** February 10, 2026
**Status:** ✅ **PRODUCTION READY**
**Docker Compose Version:** 3.8
**Node Version:** 22-alpine

🐳 **Your entire stack is now containerized and ready to deploy!**
