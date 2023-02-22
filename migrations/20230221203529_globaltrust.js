/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable('globaltrust', (table) => {
		table.text('pretrust')
		table.text('localtrust')
		table.float('alpha')
		table.bigInteger('i')
		table.float('v')
		table.index(['pretrust', 'localtrust', 'alpha'], 'globaltrust_pretrust_localtrust_alpha_idx')
		table.index(['pretrust', 'localtrust', 'alpha', 'i'], 'globaltrust_pretrust_localtrust_alpha_i_idx').unique()
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('globaltrust');
};
