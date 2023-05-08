/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.alterTable('globaltrust', (table) => {
		table.index(['strategy_id', 'date']);
		table.unique(['strategy_id', 'date', 'i']);
	})
		.raw('alter table globaltrust drop constraint globaltrust_strategy_id_i_unique')
		.raw('drop index globaltrust_strategy_id_index')
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.alterTable('globaltrust', (table) => {
		table.dropColumn('date');
		table.unique(['strategy_id', 'i']);
		table.index(['strategy_id']);
	})
};
