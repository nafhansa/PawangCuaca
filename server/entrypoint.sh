#!/bin/sh
set -e

mkdir -p /app/logs

echo "⏳ Running database migrations..."
node src/db/migrate.js

echo "🚀 Starting server..."
exec node server.js
