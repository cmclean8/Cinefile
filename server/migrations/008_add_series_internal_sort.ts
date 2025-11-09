import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('series', 'internal_sort_method');
  
  if (!hasColumn) {
    await knex.schema.alterTable('series', (table) => {
      table.string('internal_sort_method').defaultTo('chronological').notNullable(); // 'chronological', 'custom', 'alphabetical'
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('series', 'internal_sort_method');
  
  if (hasColumn) {
    await knex.schema.alterTable('series', (table) => {
      table.dropColumn('internal_sort_method');
    });
  }
}

