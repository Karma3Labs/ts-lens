/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTableIfNotExists('profiles', function (table) {
		table.string('handle').unique();
	}).createTableIfNotExists('follows', function (table) {
		table.string('follower');
		table.string('followee');
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTableIfExists('follows').dropTableIfExists('profiles');
};
