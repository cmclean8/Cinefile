import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if notes column already exists to make migration idempotent
  const hasNotesColumn = await knex.schema.hasColumn('physical_items', 'notes');
  
  if (!hasNotesColumn) {
    // Add notes column (TEXT for free-form comments, nullable)
    await knex.schema.alterTable('physical_items', (table) => {
      table.text('notes').nullable();
    });
  }
  
  // Check if notes_public column already exists
  const hasNotesPublicColumn = await knex.schema.hasColumn('physical_items', 'notes_public');
  
  if (!hasNotesPublicColumn) {
    // Add notes_public column (BOOLEAN, defaults to false for privacy)
    await knex.schema.alterTable('physical_items', (table) => {
      table.boolean('notes_public').defaultTo(false);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasNotesPublicColumn = await knex.schema.hasColumn('physical_items', 'notes_public');
  
  if (hasNotesPublicColumn) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('notes_public');
    });
  }
  
  const hasNotesColumn = await knex.schema.hasColumn('physical_items', 'notes');
  
  if (hasNotesColumn) {
    await knex.schema.alterTable('physical_items', (table) => {
      table.dropColumn('notes');
    });
  }
}
