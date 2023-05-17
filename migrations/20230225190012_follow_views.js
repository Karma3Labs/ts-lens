/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.raw(`
		create materialized view if not exists k3l_follow_counts as (
			SELECT
				profile_id,
				count(*) AS count
			FROM
				k3l_follows
			GROUP BY
				profile_id
		);
		create index k3l_follow_counts_profile_id_idx on k3l_follow_counts(profile_id);

		refresh materialized view k3l_follow_counts;
	`)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropMaterializedViewIfExists('k3l_follow_counts');
};
