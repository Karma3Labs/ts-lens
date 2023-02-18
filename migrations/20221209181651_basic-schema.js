/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.raw(`
		--Profiles Table
		create table profiles(
		id int8 primary key,
		owner_address varchar,
		creator_address varchar,
		dispatcher_address varchar,
		handle varchar,
		image_uri varchar,
		follow_module_address varchar,
		follow_module_return_data varchar,
		follow_nft_uri varchar,
		is_default boolean,
		created_at timestamptz,
		block_hash varchar not null,
		block_number int8 not null,
		block_timestamp timestamptz not null
	);
		create index profiles_by_owner on profiles(owner_address);
		create index default_profiles on profiles(owner_address, is_default);
		create index profiles_by_handle on profiles(handle);


	--Posts Table
		create table posts(
		id serial primary key,
		profile_id int8 not null,
		pub_id int8 not null,
		content_uri varchar,
		collect_module varchar,
		collect_module_return_data varchar,
		reference_module varchar,
		reference_module_return_data varchar,
		block_hash varchar not null,
		block_number int8 not null,
		block_timestamp timestamptz not null
	);
		create index post_profile_idx on posts(profile_id);
		create unique index unique_post on posts(profile_id, pub_id);


	--Follows Table
		create table follows(
		id serial primary key,
		profile_id int8 not null,
		follow_nft_id int8 not null,
		follower_address varchar,
		created_at timestamptz,
		block_hash varchar not null,
		block_number int8 not null,
		block_timestamp timestamptz not null
	);
		create index follow_profile_idx on follows(profile_id);
		create index follows_by_follower on follows(follower_address);
		create unique index unique_follow on follows(profile_id, follow_nft_id);


	--Collects Table
		create table collects(
		id serial primary key,
		profile_id int8 not null,
		pub_id int8 not null,
		collect_nft_id int8 not null,
		collector_address varchar,
		created_at timestamptz,
		block_hash varchar not null,
		block_number int8 not null,
		block_timestamp timestamptz not null
	);
		create index collect_profile_idx on collects(profile_id);
		create index collects_by_publication on collects(profile_id, pub_id);
		create index collects_by_collector on collects(collector_address);
		create unique index unique_collect on collects(profile_id, pub_id, collect_nft_id);


	--Comments Table
		create table comments(
		id serial primary key,
		profile_id int8 not null,
		pub_id int8 not null,
		to_profile_id int8 not null,
		to_pub_id int8 not null,
		content_uri varchar,
		collect_module varchar,
		collect_module_return_data varchar,
		reference_module varchar,
		reference_module_data varchar,
		reference_module_return_data varchar,
		block_hash varchar not null,
		block_number int8 not null,
		block_timestamp timestamptz not null
	);
		create index comments_from_profile_idx on comments(profile_id);
		create index comments_to_profile_idx on comments(to_profile_id);
		create index comments_by_publication on comments(to_profile_id, to_pub_id);
		create unique index unique_comment on comments(profile_id, pub_id);


	--Mirrors Table
		create table mirrors(
		id serial primary key,
		profile_id int8 not null,
		pub_id int8 not null,
		to_profile_id int8 not null,
		to_pub_id int8 not null,
		reference_module varchar,
		reference_module_data varchar,
		reference_module_return_data varchar,
		block_hash varchar not null,
		block_number int8 not null,
		block_timestamp timestamptz not null
	);
		create index mirrors_from_profile_idx on mirrors(profile_id);
		create index mirrors_to_profile_idx on mirrors(to_profile_id);
		create index mirrors_by_publication on mirrors(to_profile_id, to_pub_id);
		create unique index unique_mirror on mirrors(profile_id, pub_id);
	`)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema
		.dropTableIfExists('mirrors')
		.dropTableIfExists('comments')
		.dropTableIfExists('collects')
		.dropTableIfExists('profiles')
		.dropTableIfExists('follows')
		.dropTableIfExists('posts')
		.dropTableIfExists('profiles');
};
