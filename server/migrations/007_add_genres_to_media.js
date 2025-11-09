exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('media', 'genres');
  
  if (!hasColumn) {
    await knex.schema.alterTable('media', (table) => {
      table.text('genres').nullable(); // JSON string of genres array
    });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('media', 'genres');
  
  if (hasColumn) {
    await knex.schema.alterTable('media', (table) => {
      table.dropColumn('genres');
    });
  }
};







