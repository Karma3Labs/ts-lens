/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.alterTable('globaltrust', (table) => {
		table.timestamp('timestamp').defaultTo(knex.fn.now());
		table.index(['strategy_id', 'timestamp'])
		table.index(['strategy_id', 'timestamp', 'i'])
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.alterTable('globaltrust', (table) => {
		table.dropColumn('timestamp');
		table.dropIndex(['strategy_id', 'timestamp'])
		table.dropIndex(['strategy_id', 'timestamp', 'i'])
	})
};
