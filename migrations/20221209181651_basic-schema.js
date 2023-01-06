/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTableIfNotExists('profiles', function (table) {
		table.string('id').unique();
	}).createTableIfNotExists('follows', function (table) {
		table.string('follower');
		table.string('followee');
		table.unique(['follower', 'followee'])
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('follows').dropTable('profiles');
};
