#!/bin/bash
# Simplified deployment script - builds services one at a time

set -e

echo "🚀 BP Chandra OCR - Simple Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    cat > .env << 'EOF'
API_KEY=your-secret-api-key-change-this
REDIS_URL=redis://redis:6379/0
PYTHON_API_URL=http://localhost:8001
NEXT_PUBLIC_API_URL=http://localhost:3000
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
NODE_ENV=production
EOF
    echo -e "${YELLOW}⚠️  Edit .env and change API_KEY!${NC}"
    echo ""
fi

# Detect docker compose command
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo -e "${RED}❌ Docker Compose not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using: $DOCKER_COMPOSE_CMD${NC}"
echo ""

# Stop any running containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
$DOCKER_COMPOSE_CMD down 2>/dev/null || true
echo ""

# Pull base images first (with timeout handling)
echo -e "${BLUE}📦 Pulling base images...${NC}"
docker pull python:3.11-slim &
PID1=$!
docker pull node:20-alpine &
PID2=$!

echo "Waiting for images to download (this may take a few minutes)..."
wait $PID1 && echo "✅ Python image ready" || echo "⚠️  Python image pull failed"
wait $PID2 && echo "✅ Node image ready" || echo "⚠️  Node image pull failed"
echo ""

# Build services one at a time
echo -e "${BLUE}🔨 Building Redis (fast)...${NC}"
$DOCKER_COMPOSE_CMD build redis
echo ""

echo -e "${BLUE}🔨 Building Python backend (5-10 mins)...${NC}"
echo -e "${YELLOW}   This downloads ~4GB of ML dependencies...${NC}"
$DOCKER_COMPOSE_CMD build python-backend
echo ""

echo -e "${BLUE}🔨 Building Next.js frontend (2-3 mins)...${NC}"
$DOCKER_COMPOSE_CMD build nextjs
echo ""

# Start services
echo -e "${BLUE}🚀 Starting all services...${NC}"
$DOCKER_COMPOSE_CMD up -d
echo ""

# Wait a bit for services to start
sleep 5

# Check status
echo -e "${GREEN}📊 Service Status:${NC}"
$DOCKER_COMPOSE_CMD ps
echo ""

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${GREEN}🎉 Access your application:${NC}"
echo -e "  📱 Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "  🐍 API:       ${BLUE}http://localhost:8001${NC}"
echo -e "  📚 API Docs:  ${BLUE}http://localhost:8001/docs${NC}"
echo ""
echo -e "${YELLOW}📊 View logs:${NC}"
echo "  $DOCKER_COMPOSE_CMD logs -f"
echo ""
echo -e "${YELLOW}🔍 Check specific service:${NC}"
echo "  $DOCKER_COMPOSE_CMD logs -f python-backend"
echo "  $DOCKER_COMPOSE_CMD logs -f nextjs"
echo ""

