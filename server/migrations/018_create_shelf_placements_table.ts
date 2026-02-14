import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('shelf_placements');

  if (!hasTable) {
    await knex.schema.createTable('shelf_placements', (table) => {
      table.increments('id').primary();
      table.integer('shelf_id').notNullable();
      table.integer('physical_item_id').notNullable();
      table.integer('position').defaultTo(0);
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('shelf_id').references('id').inTable('shelves').onDelete('CASCADE');
      table.foreign('physical_item_id').references('id').inTable('physical_items').onDelete('CASCADE');

      // Each physical item can only be on one shelf at a time
      table.unique(['physical_item_id']);

      // Indexes
      table.index('shelf_id');
      table.index(['shelf_id', 'position']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('shelf_placements');
  if (hasTable) {
    await knex.schema.dropTableIfExists('shelf_placements');
  }
}
