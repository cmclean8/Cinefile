exports.up = function(knex) {
  return knex.schema.alterTable('media', (table) => {
    table.text('genres').nullable(); // JSON string of genres array
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('media', (table) => {
    table.dropColumn('genres');
  });
};





