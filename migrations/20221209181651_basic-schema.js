/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable("profiles", table => {
		table.integer("profile_id").notNullable();
		table.string("handle");
		table.specificType('followings', 'text ARRAY').nullable();
		table.datetime("created_at");
	})
		.createTable("posts", table => {
			table.text("id").primary();
			table.integer("pub_id");
			table.integer("from_profile");
			table.datetime('timestamp');
		})
		.createTable("comments", table => {
			table.text("id").primary();
			table.integer('pub_id');
			table.integer("from_profile");
			table.integer("profile_id_pointed");
			table.integer("pub_id_pointed");
			table.datetime("timestamp");
		})
		.createTable("mirrors", table => {
			table.text("id").primary();
			table.integer('pub_id');
			table.integer("from_profile");
			table.integer("profile_id_pointed");
			table.integer("pub_id_pointed");
			table.dateTime("timestamp");
		})
	// mentions
	// collectNFTs
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTableIfExists('posts').dropTableIfExists('comments').dropTableIfExists('mirrors').dropTableIfExists('profiles');
};
