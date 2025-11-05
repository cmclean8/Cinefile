#!/bin/bash

# Cinefile - Docker Build Script
# Builds the unified Docker image

set -e

echo "🎬 Cinefile - Building Docker Image"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    exit 1
fi

# Change to project root directory
cd "$(dirname "$0")/.."

echo ""
echo "📦 Building unified image (frontend + backend)..."
docker-compose build

echo ""
echo "✅ Build complete!"
echo ""
echo "Image created:"
docker images | grep -E "cinefile|REPOSITORY"

echo ""
echo "📊 Image size:"
docker images cinefile --format "{{.Size}}"

echo ""
echo "To start the application, run:"
echo "  docker-compose --env-file .env.docker up -d"

