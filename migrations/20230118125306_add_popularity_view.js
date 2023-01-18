const { drop } = require("lodash");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema
		.createMaterializedView('popularity', function (view) {
			view.columns(['user']);
			view.as(knex('follows')
				.select('followee').as('user')
				.count({ 'num_followers': 'follower' })
				.groupBy('followee')
			)
		})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema
		.dropMaterializedView('popularity')
};
