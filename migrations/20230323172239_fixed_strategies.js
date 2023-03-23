/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.from('strategies').del()
	await knex.raw('ALTER SEQUENCE strategies_id_seq RESTART WITH 1')
	await knex.from('globaltrust').del()
	await knex.from('strategies').insert([
		{
			pretrust: 'pretrustAllEqually',
			localtrust: 'existingConnections',
			alpha: 0.5
		}, {
			pretrust: 'pretrustAllEqually',
			localtrust: 'c5m8enhancedConnections',
			alpha: 0.5
		}, {
			pretrust: 'pretrustOGs',
			localtrust: 'c5m8enhancedConnections',
			alpha: 0.5
		}, {
			pretrust: 'pretrustAllEqually',
			localtrust: 'c5m8col12enhancedConnections',
			alpha: 0.5,
		}, {
			pretrust: 'pretrustOGs',
			localtrust: 'c5m8col12enhancedConnections',
			alpha: 0.5
		}
	])
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
