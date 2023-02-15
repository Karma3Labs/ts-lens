/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable("profiles", table => {
		table.integer("id");
		table.string("handle");
		table.text('_to');
		table.datetime("created_at");
	})
		.createTable("posts", table => {
			table.integer("profile_id");
		})
		.createTable("comments", table => {
			table.integer("profile_id");
			table.integer("profile_id_pointed");
		})
		.createTable("mirrors", table => {
			table.integer("profile_id");
			table.integer("profile_id_pointed");
		})
		.createTable("follows", table => {
			table.text("follower");
			table.specificType('profile_ids', 'INT[]')
		})
	// mentions
	// collectNFTs
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTableIfExists('posts').dropTableIfExists('comments').dropTableIfExists('mirrors').dropTableIfExists('profiles').dropTableIfExists('follows');
};
