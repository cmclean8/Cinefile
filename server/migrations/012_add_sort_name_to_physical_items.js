/**
 * Calculates a sort name by stripping common articles from the beginning of a name.
 * Articles handled: "The", "A", "An" (case-insensitive)
 */
function calculateSortName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return '';
  }

  // Articles to strip (case-insensitive, must be at start of string)
  const articles = ['the ', 'a ', 'an '];
  
  const lowerTrimmed = trimmed.toLowerCase();
  
  for (const article of articles) {
    if (lowerTrimmed.startsWith(article)) {
      // Remove the article and return trimmed result
      return trimmed.substring(article.length).trim();
    }
  }
  
  // No article found, return as-is
  return trimmed;
}

exports.up = async function(knex) {
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
};

exports.down = async function(knex) {
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
};

