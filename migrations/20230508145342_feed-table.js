/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable('feed', function (table) {
		table.text('strategy_name')
		table.text('post_id').primary()
		table.double('v')

		table.index(['strategy_name'])
		table.index(['strategy_name', 'post_id'])
	})
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('feed')
};