/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.raw(`
		create materialized view if not exists k3l_collect_nft as
			with pub_prices as (
				select
					(cast(left(collect_dtls.amount, 3) as integer)/1000.0) as matic_price,
					collect_dtls.publication_id as post_id
				from publication_collect_module_details as collect_dtls
				inner join profile_post as post
					on (post.post_id = collect_dtls.publication_id)
				where amount is not null
				and collect_dtls.currency = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
			),
			collects as (
				SELECT concat(profile.profile_id, '-', publication_collect_module_collected_records.collect_publication_nft_id) AS collect_nft_id,
				profile.profile_id,
				publication_collect_module_collected_records.collect_publication_nft_id AS pub_id,
				"substring"(publication_collect_module_collected_records.publication_id::text, 1, POSITION(('-'::text) IN (publication_collect_module_collected_records.publication_id)) - 1) AS to_profile_id,
				"substring"(publication_collect_module_collected_records.publication_id::text, POSITION(('-'::text) IN (publication_collect_module_collected_records.publication_id)) + 1) AS to_pub_id,
				publication_collect_module_collected_records.publication_id as to_post_id,
				publication_collect_module_collected_records.record_id AS metadata,
				publication_collect_module_collected_records.block_timestamp AS created_at
				FROM publication_collect_module_collected_records
				LEFT JOIN profile ON publication_collect_module_collected_records.collected_by::text = profile.owned_by::text
			)
			select collects.*, pub_prices.matic_price from collects
				left join pub_prices on pub_prices.post_id = collects.to_post_id;
	`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.raw(`
		drop materialized view if exists k3l_collect_nft;
	`);
};
