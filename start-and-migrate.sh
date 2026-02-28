#!/bin/bash

echo "🚀 Starting PureSoul services..."
docker compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

echo "📊 Checking service status..."
docker compose ps

echo ""
echo "🗄️  Running database migrations..."
echo ""

echo "📝 Migration 1/3: Flexible Entries System..."
docker compose exec -T postgres psql -U puresoul -d puresoul < db/migrations/007_flexible_entries.sql

echo ""
echo "📝 Migration 2/3: Views System..."
docker compose exec -T postgres psql -U puresoul -d puresoul < db/migrations/008_views_system.sql

echo ""
echo "📝 Migration 3/3: Voice Realtime Sessions..."
docker compose exec -T postgres psql -U puresoul -d puresoul < db/migrations/016_voice_realtime_sessions.sql

echo ""
echo "✅ All migrations complete!"
echo ""
echo "🌐 Application available at: http://localhost:4000"
echo "📊 Check logs with: docker compose logs -f app"
