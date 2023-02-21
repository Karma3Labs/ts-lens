/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable('globaltrusts', (table) => {
		table.text('pretrust_strategy')
		table.text('localtrust_strategy')
		table.bigInteger('id')
		table.float('globaltrust')
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('globaltrusts');
};
