exports.up = async function(knex) {
  // Check if column already exists to make migration idempotent
  const hasColumn = await knex.schema.hasColumn('physical_items', 'sort_series_id');
  
  if (!hasColumn) {
    // Add sort_series_id column for sorting preference
    // This is separate from primary_series_id which is used to sync media to series
    await knex.schema.alterTable('physical_items', (table) => {
      table.integer('sort_series_id').nullable();
    });
    
    // Add index for sorting performance
    await knex.schema.alterTable('physical_items', (table) => {
      table.index('sort_series_id');
    });
    
    // Note: SQLite doesn't support adding foreign key constraints via ALTER TABLE
    // The foreign key will be enforced at the application level
    
    // Migrate existing data: copy primary_series_id to sort_series_id for consistency
    // This ensures existing items with primary_series_id set will continue sorting correctly
    await knex('physical_items')
      .whereNotNull('primary_series_id')
      .update({
        sort_series_id: knex.ref('primary_series_id')
      });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('physical_items', 'sort_series_id');
  
  if (hasColumn) {
    // Drop index first
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropIndex('sort_series_id');
    });
    
    // Drop column
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('sort_series_id');
    });
  }
};
