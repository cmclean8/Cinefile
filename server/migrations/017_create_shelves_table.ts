import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('shelves');

  if (!hasTable) {
    await knex.schema.createTable('shelves', (table) => {
      table.increments('id').primary();
      table.integer('group_id').notNullable();
      table.string('name').notNullable();
      table.string('display_name').notNullable();
      table.integer('capacity_units').notNullable().defaultTo(10); // Default: 10 standard cases
      table.float('width_mm').nullable();  // Optional precise width override
      table.float('depth_mm').nullable();  // Optional precise depth
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);

      // Foreign key
      table.foreign('group_id').references('id').inTable('shelf_groups').onDelete('CASCADE');

      // Indexes
      table.index('group_id');
      table.index('sort_order');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('shelves');
  if (hasTable) {
    await knex.schema.dropTableIfExists('shelves');
  }
}
