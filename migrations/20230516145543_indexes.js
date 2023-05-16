/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.raw(`CREATE INDEX idx_k3l_posts_post_id ON k3l_posts (post_id)`)
	await knex.raw(`CREATE INDEX idx_publication_stats_publication_id ON publication_stats (publication_id)`)
	await knex.raw(`CREATE INDEX idx_profile_post_block_timestamp ON profile_post (block_timestamp DESC)`)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
	await knex.raw(`DROP INDEX idx_k3l_posts_post_id ON k3l_posts`)
	await knex.raw(`DROP INDEX idx_publication_stats_publication_id ON publication_stats`)
	await knex.raw(`DROP INDEX idx_profile_post_block_timestamp ON profile_post`)
};
