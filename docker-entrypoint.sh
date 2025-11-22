#!/bin/sh
set -e

echo "🎬 Cinefile - Starting..."
echo "==========================="

# Ensure data directories exist
echo "📁 Creating data directories..."
# Ensure /data base directory exists
mkdir -p /data
# Ensure database directory exists (extract directory from DATABASE_PATH)
mkdir -p "$(dirname "$DATABASE_PATH")"
# Ensure uploads directory exists
mkdir -p /data/uploads
echo "✅ Data directories ready"

# Check for required environment variables
if [ -z "$TMDB_API_KEY" ]; then
    echo "⚠️  WARNING: TMDB_API_KEY is not set!"
    echo "   Movie search will not work without a TMDb API key."
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "⚠️  WARNING: ADMIN_PASSWORD is not set!"
    echo "   Admin panel will not be accessible."
fi

# Run database migrations with safety checks
echo ""
echo "🗄️  Running database migrations..."

# Check data integrity before migrations
if [ -f "$DATABASE_PATH" ]; then
  echo "🔍 Pre-migration data check..."
  PHYSICAL_ITEMS=$(node -e "const db = require('better-sqlite3')('$DATABASE_PATH'); try { const rows = db.prepare('SELECT COUNT(*) as count FROM physical_items').get(); console.log(rows.count); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
  LINKS=$(node -e "const db = require('better-sqlite3')('$DATABASE_PATH'); try { const rows = db.prepare('SELECT COUNT(*) as count FROM physical_item_media').get(); console.log(rows.count); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
  
  if [ "$PHYSICAL_ITEMS" -gt 0 ] && [ "$LINKS" -gt 0 ]; then
    echo "   Found $PHYSICAL_ITEMS physical items with $LINKS links"
    echo "💾 Creating backup before migration..."
    BACKUP_PATH="${DATABASE_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$DATABASE_PATH" "$BACKUP_PATH" 2>/dev/null || true
    echo "✅ Backup created: $(basename $BACKUP_PATH)"
  fi
fi

if npx knex migrate:latest; then
  echo "✅ Database migrations completed successfully"
  
  # Verify data integrity after migrations
  if [ -f "$DATABASE_PATH" ]; then
    echo "🔍 Post-migration data check..."
    NEW_LINKS=$(node -e "const db = require('better-sqlite3')('$DATABASE_PATH'); try { const rows = db.prepare('SELECT COUNT(*) as count FROM physical_item_media').get(); console.log(rows.count); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
    
    if [ "$PHYSICAL_ITEMS" -gt 0 ] && [ "$NEW_LINKS" -eq 0 ] && [ "$LINKS" -gt 0 ]; then
      echo "⚠️  WARNING: Links were lost during migration!"
      echo "   Before: $LINKS links, After: $NEW_LINKS links"
      echo "   Check backup: $BACKUP_PATH"
    else
      echo "✅ Data integrity verified"
    fi
  fi
else
  echo "❌ Database migrations failed!"
  exit 1
fi

# Check database
if [ -f "$DATABASE_PATH" ]; then
    DB_SIZE=$(du -h "$DATABASE_PATH" | cut -f1)
    echo "✅ Database found: $DATABASE_PATH ($DB_SIZE)"
else
    echo "📝 Database will be created at: $DATABASE_PATH"
fi

echo ""
echo "🚀 Starting Cinefile servers..."
echo "=================================="
echo "📡 Read-Only Server (Public):"
echo "   - Container port: 3000"
echo "   - Host port: ${READ_ONLY_PORT:-3000} (configured via READ_ONLY_PORT env var)"
echo "   - Access: http://localhost:${READ_ONLY_PORT:-3000}"
echo ""
echo "📡 Full API Server (Admin):"
echo "   - Container port: 3001"
echo "   - Host port: ${ADMIN_PORT:-3001} (configured via ADMIN_PORT env var)"
echo "   - Access: http://localhost:${ADMIN_PORT:-3001}"
echo "=================================="
echo ""

# Start read-only server in background
# Server always listens on port 3000 inside container
# Host port mapping is configured in docker-compose.yml
echo "🔒 Starting read-only server on port 3000..."
PORT=3000 node dist/index-readonly.js &
READONLY_PID=$!
echo "✅ Read-only server started (PID: $READONLY_PID)"

# Start full API server in background
# Server always listens on port 3001 inside container
# Host port mapping is configured in docker-compose.yml
echo "🔓 Starting full API server on port 3001..."
PORT=3001 node dist/index-full.js &
FULL_PID=$!
echo "✅ Full API server started (PID: $FULL_PID)"
echo ""

# Cleanup function to handle shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $READONLY_PID $FULL_PID 2>/dev/null || true
    wait $READONLY_PID $FULL_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Wait for both processes
wait $READONLY_PID $FULL_PID

