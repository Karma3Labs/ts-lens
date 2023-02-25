/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.raw(`
		create materialized view profile_follows as (
			SELECT
				follower.id AS follower,
				follows.profile_id AS following
			FROM follows
			JOIN
				profiles follower
			ON
				follows.follower_address::text = follower.owner_address::text
		);
		create index profile_follows_follower_idx on profile_follows(follower);
		create index profile_follows_following_idx on profile_follows(following);

		create materialized view follower_counts as (
			SELECT
				profile_follows.follower AS profile_id,
				count(*) AS count
			FROM
				profile_follows
			GROUP BY
				profile_follows.follower
		);
		create index follower_counts_profile_id_idx on follower_counts(profile_id);
	`)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropMaterializedViewIfExists('profile_follows')
};
