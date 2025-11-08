import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('media', (table) => {
    table.text('genres').nullable(); // JSON string of genres array
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('media', (table) => {
    table.dropColumn('genres');
  });
}





