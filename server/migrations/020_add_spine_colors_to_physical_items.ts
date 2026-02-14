import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add spine_color column (dominant color for spine display)
  const hasSpineColor = await knex.schema.hasColumn('physical_items', 'spine_color');
  if (!hasSpineColor) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.string('spine_color').nullable(); // e.g. '#1a3c5e'
    });
  }

  // Add spine_color_accent column (text/secondary color for spine display)
  const hasSpineColorAccent = await knex.schema.hasColumn('physical_items', 'spine_color_accent');
  if (!hasSpineColorAccent) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.string('spine_color_accent').nullable(); // e.g. '#e8d4a0'
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasSpineColorAccent = await knex.schema.hasColumn('physical_items', 'spine_color_accent');
  if (hasSpineColorAccent) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('spine_color_accent');
    });
  }

  const hasSpineColor = await knex.schema.hasColumn('physical_items', 'spine_color');
  if (hasSpineColor) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('spine_color');
    });
  }
}
