exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('physical_library');

  if (!hasTable) {
    await knex.schema.createTable('physical_library', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('display_name').notNullable();
      table.timestamps(true, true);
    });
  }

  // Seed the default library if none exists
  const existing = await knex('physical_library').first();
  if (!existing) {
    await knex('physical_library').insert({
      name: 'default',
      display_name: 'My Physical Library',
    });
  }
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('physical_library');
  if (hasTable) {
    await knex.schema.dropTableIfExists('physical_library');
  }
};
