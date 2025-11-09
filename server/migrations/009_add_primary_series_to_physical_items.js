exports.up = async function(knex) {
  // Check if column already exists to make migration idempotent
  const hasColumn = await knex.schema.hasColumn('physical_items', 'primary_series_id');
  
  if (!hasColumn) {
    // SQLite doesn't support adding foreign keys via ALTER TABLE
    // So we add the column first, then add the index separately
    await knex.schema.alterTable('physical_items', (table) => {
      table.integer('primary_series_id').nullable();
    });
    
    // Add index
    await knex.schema.alterTable('physical_items', (table) => {
      table.index('primary_series_id');
    });
    
    // Note: SQLite doesn't support adding foreign key constraints via ALTER TABLE
    // The foreign key will be enforced at the application level
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('physical_items', 'primary_series_id');
  
  if (hasColumn) {
    // Drop index first
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropIndex('primary_series_id');
    });
    
    // Drop column
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('primary_series_id');
    });
  }
};

