/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.schema.createTable('globaltrust', (table) => {
		table.string('strategy_name')
		table.string('i')
		table.double('v')
		table.date('date').defaultTo(knex.fn.now());

		table.index(['strategy_name', 'date']);
		table.unique(['strategy_name', 'date', 'i']);
	})

	await knex.schema.createTable('localtrust', (table) => {
		table.string('strategy_name');
		table.string('i').notNullable();
		table.string('j').notNullable();
		table.double('v').notNullable();
		table.date('date').notNullable().defaultTo(knex.fn.now());
		table.index('strategy_name', 'localtrust_id_idx');
	})
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('globaltrust').dropTable('localtrust');
};
