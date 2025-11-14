#!/bin/bash

# BP Chandra OCR - Quick Start Script
# This script helps you quickly set up and run the application

set -e

echo "🚀 BP Chandra OCR - Quick Start"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_info "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi
print_success "Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm $(npm -v) found"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi
print_success "Python $(python3 --version) found"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. You'll need Docker to run Redis."
    print_info "Install Docker from: https://docs.docker.com/get-docker/"
fi

echo ""
print_info "Setting up environment..."

# Create .env files if they don't exist
if [ ! -f .env ]; then
    print_info "Creating .env file..."
    cp .env.example .env
    print_success ".env file created"
else
    print_warning ".env file already exists"
fi

if [ ! -f python-backend/.env ]; then
    print_info "Creating python-backend/.env file..."
    cp python-backend/.env.example python-backend/.env
    print_success "python-backend/.env file created"
else
    print_warning "python-backend/.env file already exists"
fi

# Create directories
print_info "Creating necessary directories..."
mkdir -p logs uploads outputs temp
mkdir -p python-backend/logs python-backend/uploads python-backend/outputs python-backend/temp
print_success "Directories created"

# Install dependencies
echo ""
print_info "Installing dependencies..."
read -p "Install Node.js dependencies? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installing Node.js packages..."
    npm install
    print_success "Node.js dependencies installed"
fi

read -p "Install Python dependencies? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installing Python packages..."
    cd python-backend
    pip install -r requirements.txt
    cd ..
    print_success "Python dependencies installed"
fi

# Start services
echo ""
echo "========================================"
print_info "Ready to start services!"
echo ""
echo "Choose an option:"
echo "1) Start with Docker (recommended)"
echo "2) Start manually (without Docker)"
echo "3) Exit"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        print_info "Starting services with Docker..."
        docker-compose -f docker-compose.dev.yml up -d
        echo ""
        print_success "Services started!"
        echo ""
        echo "Access the application:"
        echo "  🌐 Web UI:      http://localhost:3000"
        echo "  🔧 Python API:  http://localhost:8001"
        echo "  📚 API Docs:    http://localhost:8001/docs"
        echo ""
        echo "View logs:"
        echo "  docker-compose -f docker-compose.dev.yml logs -f"
        echo ""
        echo "Stop services:"
        echo "  docker-compose -f docker-compose.dev.yml down"
        ;;
    2)
        print_info "Starting Redis..."
        docker run -d -p 6379:6379 --name chandra-redis redis:7-alpine || docker start chandra-redis
        print_success "Redis started"
        
        echo ""
        print_info "Starting Python backend..."
        print_info "Run in a new terminal:"
        echo "  cd python-backend"
        echo "  python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"
        
        echo ""
        print_info "Starting Next.js frontend..."
        print_info "Run in another new terminal:"
        echo "  npm run dev"
        
        echo ""
        print_success "Manual setup instructions provided!"
        echo ""
        echo "After starting services, access:"
        echo "  🌐 Web UI:      http://localhost:3000"
        echo "  🔧 Python API:  http://localhost:8001"
        echo "  📚 API Docs:    http://localhost:8001/docs"
        ;;
    3)
        print_info "Setup complete! You can start services later."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Setup complete! 🎉"
echo ""
print_info "Next steps:"
echo "  1. Edit .env files with your configuration"
echo "  2. Read README.md for detailed documentation"
echo "  3. Check API_DOCUMENTATION.md for API usage"
echo "  4. Visit http://localhost:3000 to use the web interface"
echo ""
print_info "Need help? Check the documentation or open an issue on GitHub"
echo ""

