/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.from('strategies').where({
		pretrust: 'pretrustAllEqually'
	}).del()
	await knex.from('strategies').insert({
		pretrust: 'pretrustOGs',
		localtrust: 'existingConnections',
		alpha: 0.5
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
	await knex.from('strategies').insert({
		pretrust: 'pretrustAllEqually',
		localtrust: 'existingConnections',
		alpha: 0.5
	}, {
		pretrust: 'pretrustAllEqually',
		localtrust: 'c5m8enhancedConnections',
		alpha: 0.5
	}, {
		pretrust: 'pretrustAllEqually',
		localtrust: 'c5m8col12enhancedConnections',
		alpha: 0.5,
	})
	await knex.from('strategies').where({
		pretrust: 'pretrustOGs',
		localtrust: 'existingConnections'
	}).del()
};
