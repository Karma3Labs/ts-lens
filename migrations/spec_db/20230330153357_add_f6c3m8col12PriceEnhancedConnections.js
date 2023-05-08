/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.from('strategies').insert([{
		pretrust: 'pretrustOGs',
		localtrust: 'f6c3m8col12PriceEnhancedConnections',
		alpha: 0.5
	}])

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.from('strategies').where({
		pretrust: 'pretrustOGs',
		localtrust: 'f6c3m8col12PriceEnhancedConnections',
		alpha: 0.5
	}).del()
};
