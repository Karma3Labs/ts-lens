/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.schema.dropMaterializedViewIfExists('weighted_localtrust')
	await knex.schema.dropViewIfExists('weighted_localtrust_source')
	await knex.schema.dropTableIfExists('localtrust_weights')
	await knex.schema.dropTableIfExists('localtrust_strategies')

	await knex.schema.createTable('localtrust_strategies', (table) => {
		table.increments('id').primary();
		table.text('name');
	})
	await knex('localtrust_strategies').insert([
		{
			name: 'existingConnections'
		}, {
			name: 'f6c3m8col12enhancedConnections'
		}, {
			name: 'f6c3m8enhancedConnections'
		}, {
			name: 'f6c3m8col12PriceEnhancedConnections'
		}
	])

	await knex.schema.createTable('localtrust', (table) => {
		table.integer('strategy_id');
		table.integer('i').notNullable();
		table.integer('j').notNullable();
		table.double('v').notNullable();
		table.date('date').notNullable().defaultTo(knex.fn.now());
		table.index('strategy_id', 'localtrust_id_idx');
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
	await knex.schema.dropTable('localtrust');
	await knex.schema.dropTable('localtrust_strategies')
};
