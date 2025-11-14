# 🚀 Quick Server Setup Guide

## Step 1: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt update
sudo apt install docker-compose -y

# Log out and back in for group changes to take effect
# Or run: newgrp docker
```

## Step 2: Get the Code

### Option A: Download as ZIP (Easiest)

```bash
# Download and extract
wget https://github.com/lukejamison/bp-chandra-orc/archive/refs/heads/main.zip
unzip main.zip
mv bp-chandra-orc-main bp-chandra-orc
cd bp-chandra-orc
```

### Option B: Clone with Personal Access Token

1. **Create a GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name like "bp-chandra-orc"
   - Select scope: `repo` (Full control of private repositories)
   - Click "Generate token"
   - **COPY THE TOKEN** (you won't see it again!)

2. **Clone with token:**
   ```bash
   git clone https://github.com/lukejamison/bp-chandra-orc.git
   # When prompted:
   # Username: lukejamison
   # Password: [PASTE YOUR TOKEN HERE]
   
   cd bp-chandra-orc
   ```

### Option C: Clone with SSH (If you have SSH keys set up)

```bash
git clone git@github.com:lukejamison/bp-chandra-orc.git
cd bp-chandra-orc
```

## Step 3: Deploy

```bash
# Make script executable
chmod +x deploy-to-server.sh

# Run deployment
./deploy-to-server.sh
```

## Step 4: Configure

```bash
# Edit the .env file and change the API_KEY
nano .env

# Change this line:
# API_KEY=your-secret-api-key-change-this
# To something secure like:
# API_KEY=super-secret-key-$(openssl rand -hex 16)
```

## Step 5: Restart

```bash
# Restart services with new config
docker-compose restart

# Check if everything is running
docker-compose ps

# View logs
docker-compose logs -f
```

## Step 6: Access Your App

Open your browser:
- Frontend: `http://YOUR_SERVER_IP:3000`
- API: `http://YOUR_SERVER_IP:8000`
- API Docs: `http://YOUR_SERVER_IP:8000/docs`

## Troubleshooting

### Check Docker Installation

```bash
docker --version
docker-compose --version
```

### If Docker commands need sudo

```bash
# Add yourself to docker group
sudo usermod -aG docker $USER

# Then log out and back in, or run:
newgrp docker
```

### View Container Status

```bash
docker-compose ps
docker-compose logs -f
```

### Clean Start

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Quick Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f python-backend

# Check resource usage
docker stats

# Update application
git pull
docker-compose build
docker-compose up -d
```

