#!/bin/bash

# Cinefile - Docker Backup Script
# Backs up database and uploaded files

set -e

echo "🎬 Cinefile - Backup Script"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    exit 1
fi

# Change to project root directory
cd "$(dirname "$0")/.."

# Create backups directory
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Check if container is running
if ! docker ps | grep -q "cinefile"; then
    echo "⚠️  Warning: cinefile container is not running"
    echo "Starting container..."
    docker-compose --env-file .env.docker up -d
    sleep 5
fi

echo ""
echo "💾 Backing up database..."
DB_BACKUP="$BACKUP_DIR/database-$TIMESTAMP.sqlite"
docker cp cinefile:/data/database.sqlite "$DB_BACKUP"

if [ -f "$DB_BACKUP" ]; then
    DB_SIZE=$(ls -lh "$DB_BACKUP" | awk '{print $5}')
    echo "✅ Database backed up: $DB_BACKUP ($DB_SIZE)"
else
    echo "❌ Error: Database backup failed"
    exit 1
fi

echo ""
echo "📸 Backing up uploaded images..."
UPLOADS_BACKUP="$BACKUP_DIR/uploads-$TIMESTAMP"
docker cp cinefile:/data/uploads "$UPLOADS_BACKUP"

if [ -d "$UPLOADS_BACKUP" ]; then
    UPLOAD_COUNT=$(find "$UPLOADS_BACKUP" -type f | wc -l)
    UPLOADS_SIZE=$(du -sh "$UPLOADS_BACKUP" | awk '{print $1}')
    echo "✅ Uploads backed up: $UPLOADS_BACKUP ($UPLOAD_COUNT files, $UPLOADS_SIZE)"
else
    echo "⚠️  No uploads directory found (this is normal for new installations)"
fi

echo ""
echo "📦 Creating compressed archive..."
ARCHIVE="$BACKUP_DIR/cinefile-backup-$TIMESTAMP.tar.gz"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" \
    "database-$TIMESTAMP.sqlite" \
    "uploads-$TIMESTAMP" 2>/dev/null || true

if [ -f "$ARCHIVE" ]; then
    ARCHIVE_SIZE=$(ls -lh "$ARCHIVE" | awk '{print $5}')
    echo "✅ Archive created: $ARCHIVE ($ARCHIVE_SIZE)"
    
    # Clean up individual backup files
    rm -f "$DB_BACKUP"
    rm -rf "$UPLOADS_BACKUP"
    
    echo ""
    echo "✅ Backup complete!"
    echo ""
    echo "📁 Backup location: $ARCHIVE"
    echo ""
    echo "To restore this backup:"
    echo "  1. Stop the application: docker-compose down"
    echo "  2. Extract archive: tar -xzf $ARCHIVE -C $BACKUP_DIR"
    echo "  3. Restore database: docker cp $BACKUP_DIR/database-$TIMESTAMP.sqlite cinefile:/data/database.sqlite"
    echo "  4. Restore uploads: docker cp $BACKUP_DIR/uploads-$TIMESTAMP/. cinefile:/data/uploads/"
    echo "  5. Restart: docker-compose --env-file .env.docker up -d"
else
    echo "❌ Error: Failed to create archive"
    exit 1
fi

echo ""
echo "💡 Tip: Keep regular backups in a safe location!"

