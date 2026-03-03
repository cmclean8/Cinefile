import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add thickness_units column
  const hasThicknessUnits = await knex.schema.hasColumn('physical_items', 'thickness_units');
  if (!hasThicknessUnits) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.integer('thickness_units').defaultTo(1); // 1 standard case = 12.5mm
    });
  }

  // Add width_mm column (optional precise override)
  const hasWidthMm = await knex.schema.hasColumn('physical_items', 'width_mm');
  if (!hasWidthMm) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.float('width_mm').nullable();
    });
  }

  // Add height_mm column (optional precise override)
  const hasHeightMm = await knex.schema.hasColumn('physical_items', 'height_mm');
  if (!hasHeightMm) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.float('height_mm').nullable();
    });
  }

  // Add depth_mm column (optional precise override)
  const hasDepthMm = await knex.schema.hasColumn('physical_items', 'depth_mm');
  if (!hasDepthMm) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.float('depth_mm').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasDepthMm = await knex.schema.hasColumn('physical_items', 'depth_mm');
  if (hasDepthMm) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('depth_mm');
    });
  }

  const hasHeightMm = await knex.schema.hasColumn('physical_items', 'height_mm');
  if (hasHeightMm) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('height_mm');
    });
  }

  const hasWidthMm = await knex.schema.hasColumn('physical_items', 'width_mm');
  if (hasWidthMm) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('width_mm');
    });
  }

  const hasThicknessUnits = await knex.schema.hasColumn('physical_items', 'thickness_units');
  if (hasThicknessUnits) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('thickness_units');
    });
  }
}
