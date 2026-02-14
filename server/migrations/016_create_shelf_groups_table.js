exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('shelf_groups');

  if (!hasTable) {
    await knex.schema.createTable('shelf_groups', (table) => {
      table.increments('id').primary();
      table.integer('library_id').notNullable();
      table.string('name').notNullable();
      table.string('display_name').notNullable();
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);

      // Foreign key
      table.foreign('library_id').references('id').inTable('physical_library').onDelete('CASCADE');

      // Indexes
      table.index('library_id');
      table.index('sort_order');
    });
  }
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('shelf_groups');
  if (hasTable) {
    await knex.schema.dropTableIfExists('shelf_groups');
  }
};
