#!/bin/bash

# PureSoul - Clean Rebuild Script
# This fixes the stale JavaScript bundle issue

echo "🔨 Stopping containers..."
docker compose down

echo "🧹 Removing old images..."
docker compose rm -f
docker rmi puresoul-app 2>/dev/null || true

echo "🏗️  Building fresh with no cache..."
docker compose build --no-cache app

echo "🚀 Starting services..."
docker compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "✅ Rebuild complete!"
echo ""
echo "📊 Service status:"
docker compose ps

echo ""
echo "🌐 Application should be available at:"
echo "   http://localhost:4000"
echo ""
echo "📝 View logs with: docker compose logs -f app"
