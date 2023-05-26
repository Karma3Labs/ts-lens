/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.schema.raw('CREATE INDEX ON k3l_collect_nft ("profile_id")');
	await knex.schema.raw('CREATE INDEX ON k3l_collect_nft ("to_profile_id")');
	await knex.schema.raw('CREATE INDEX ON k3l_comments ("profile_id")');
	await knex.schema.raw('CREATE INDEX ON k3l_comments ("to_profile_id")');
	await knex.schema.raw('CREATE INDEX ON k3l_mirrors ("profile_id")');
	await knex.schema.raw('CREATE INDEX ON k3l_mirrors ("to_profile_id")');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
