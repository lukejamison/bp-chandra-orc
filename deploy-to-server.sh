#!/bin/bash
# Deploy BP Chandra OCR to your Linux server

set -e

echo "🚀 BP Chandra OCR - Server Deployment Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. Please install Docker first.${NC}"
    echo "Install with: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    cat > .env << EOF
# API Configuration
API_KEY=your-secret-api-key-change-this
REDIS_URL=redis://redis:6379/0

# Optional: OpenAI API key for Chandra OCR advanced features
# OPENAI_API_KEY=sk-your-openai-key-here

# Next.js Configuration
PYTHON_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Environment
NODE_ENV=production
EOF
    echo -e "${YELLOW}⚠️  Please edit .env file and update API_KEY before proceeding!${NC}"
    echo ""
fi

# Stop any running containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true
echo ""

# Build and start containers
echo -e "${BLUE}🔨 Building Docker images (this may take 10-15 minutes)...${NC}"
echo -e "${YELLOW}   Note: The Python backend is large (~4-5 GB) due to ML dependencies${NC}"
docker-compose build --no-cache

echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}🎉 Your application is now running:${NC}"
echo ""
echo -e "  📱 Next.js Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "  🐍 Python API:       ${BLUE}http://localhost:8000${NC}"
echo -e "  📚 API Docs:         ${BLUE}http://localhost:8000/docs${NC}"
echo -e "  🔴 Redis:            ${BLUE}localhost:6379${NC}"
echo ""
echo -e "${YELLOW}📊 View logs:${NC}"
echo "  docker-compose logs -f"
echo ""
echo -e "${YELLOW}🛑 Stop services:${NC}"
echo "  docker-compose down"
echo ""
echo -e "${YELLOW}♻️  Restart services:${NC}"
echo "  docker-compose restart"
echo ""

