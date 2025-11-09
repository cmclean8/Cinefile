#!/bin/sh
# Migration safety script - checks data integrity before and after migrations

set -e

DATABASE_PATH="${DATABASE_PATH:-/data/database.sqlite}"

check_data_integrity() {
  echo "🔍 Checking data integrity..."
  
  if [ ! -f "$DATABASE_PATH" ]; then
    echo "✅ No existing database, migrations will create it"
    return 0
  fi
  
  # Check critical table row counts
  PHYSICAL_ITEMS=$(node -e "const db = require('better-sqlite3')('$DATABASE_PATH'); const rows = db.prepare('SELECT COUNT(*) as count FROM physical_items').get(); console.log(rows.count);" 2>/dev/null || echo "0")
  MEDIA=$(node -e "const db = require('better-sqlite3')('$DATABASE_PATH'); const rows = db.prepare('SELECT COUNT(*) as count FROM media').get(); console.log(rows.count);" 2>/dev/null || echo "0")
  LINKS=$(node -e "const db = require('better-sqlite3')('$DATABASE_PATH'); const rows = db.prepare('SELECT COUNT(*) as count FROM physical_item_media').get(); console.log(rows.count);" 2>/dev/null || echo "0")
  
  echo "   Physical Items: $PHYSICAL_ITEMS"
  echo "   Media: $MEDIA"
  echo "   Links: $LINKS"
  
  # Warn if we have items but no links
  if [ "$PHYSICAL_ITEMS" -gt 0 ] && [ "$LINKS" -eq 0 ]; then
    echo "⚠️  WARNING: Physical items exist but no links found!"
    echo "   This might indicate a previous migration issue."
    return 1
  fi
  
  return 0
}

backup_database() {
  if [ -f "$DATABASE_PATH" ]; then
    BACKUP_PATH="${DATABASE_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Creating database backup: $BACKUP_PATH"
    cp "$DATABASE_PATH" "$BACKUP_PATH"
    echo "✅ Backup created"
  fi
}

restore_backup() {
  LATEST_BACKUP=$(ls -t "${DATABASE_PATH}.backup."* 2>/dev/null | head -1)
  if [ -n "$LATEST_BACKUP" ]; then
    echo "🔄 Restoring from backup: $LATEST_BACKUP"
    cp "$LATEST_BACKUP" "$DATABASE_PATH"
    echo "✅ Backup restored"
  fi
}

# Main execution
if [ "$1" = "check" ]; then
  check_data_integrity
elif [ "$1" = "backup" ]; then
  backup_database
elif [ "$1" = "restore" ]; then
  restore_backup
else
  echo "Usage: $0 {check|backup|restore}"
  exit 1
fi

