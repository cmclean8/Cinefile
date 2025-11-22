import { Knex } from 'knex';
import { calculateSortName } from '../src/utils/sort-name.util';

export async function up(knex: Knex): Promise<void> {
  // Check if column already exists to make migration idempotent
  const hasColumn = await knex.schema.hasColumn('physical_items', 'sort_name');
  
  if (!hasColumn) {
    // Add sort_name column
    await knex.schema.alterTable('physical_items', (table) => {
      table.string('sort_name').nullable();
    });
    
    // Add index for efficient sorting
    await knex.schema.alterTable('physical_items', (table) => {
      table.index('sort_name');
    });
    
    // Backfill existing records: calculate sort_name from name
    const physicalItems = await knex('physical_items')
      .select('id', 'name')
      .whereNull('sort_name');
    
    // Update in batches to avoid memory issues with large datasets
    const batchSize = 100;
    for (let i = 0; i < physicalItems.length; i += batchSize) {
      const batch = physicalItems.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(item => {
          const sortName = calculateSortName(item.name || '');
          return knex('physical_items')
            .where('id', item.id)
            .update({ sort_name: sortName || null });
        })
      );
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('physical_items', 'sort_name');
  
  if (hasColumn) {
    // Drop index first
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropIndex('sort_name');
    });
    
    // Drop column
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('sort_name');
    });
  }
}

