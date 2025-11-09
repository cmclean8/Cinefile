import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('media', 'genres');
  
  if (!hasColumn) {
    await knex.schema.alterTable('media', (table) => {
      table.text('genres').nullable(); // JSON string of genres array
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('media', 'genres');
  
  if (hasColumn) {
    await knex.schema.alterTable('media', (table) => {
      table.dropColumn('genres');
    });
  }
}







