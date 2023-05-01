/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.schema.alterTable('posts', (table) => {
		table.integer('mirrors_count').defaultTo(0)
		table.integer('comments_count').defaultTo(0)
		table.integer('collects_count').defaultTo(0)
	})

	await knex('posts').update({
		mirrors_count: knex.raw('(SELECT COUNT(*) FROM mirrors WHERE mirrors.to_pub_id = posts.pub_id and mirrors.to_profile_id = posts.profile_id)'),
		comments_count: knex.raw('(SELECT COUNT(*) FROM comments WHERE comments.to_pub_id = posts.pub_id and comments.to_profile_id = posts.profile_id)'),
		collects_count: knex.raw('(SELECT COUNT(*) FROM collects WHERE collects.pub_id = posts.pub_id and collects.profile_id = posts.profile_id)'),
	})

	await knex.raw(`
		CREATE OR REPLACE FUNCTION update_post_counts() RETURNS TRIGGER AS $$
		BEGIN
			IF (TG_OP = 'INSERT') THEN		
				UPDATE posts SET mirrors_count = mirrors_count + 1 WHERE pub_id = NEW.to_pub_id and profile_id = NEW.to_profile_id;
				UPDATE posts SET comments_count = comments_count + 1 WHERE pub_id = NEW.to_pub_id and profile_id = NEW.to_profile_id;
				UPDATE posts SET collects_count = collects_count + 1 WHERE pub_id = NEW.pub_id and profile_id = NEW.profile_id;
			ELSIF (TG_OP = 'DELETE') THEN
				UPDATE posts SET mirrors_count = mirrors_count - 1 WHERE pub_id = OLD.to_pub_id and profile_id = OLD.to_profile_id;
				UPDATE posts SET comments_count = comments_count - 1 WHERE pub_id = OLD.to_pub_id and profile_id = OLD.to_profile_id;
				UPDATE posts SET collects_count = collects_count - 1 WHERE pub_id = OLD.pub_id and profile_id = OLD.profile_id;
			END IF;
			RETURN NULL;
		END;
		$$ LANGUAGE plpgsql;
	`)

	await knex.raw(`
		CREATE TRIGGER update_post_counts_trigger
			AFTER INSERT OR DELETE ON mirrors
		FOR EACH ROW EXECUTE PROCEDURE update_post_counts();
	`)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
	await knex.schema.alterTable('posts', (table) => {
		table.dropColumn('mirrors_count')
		table.dropColumn('comments_count')
		table.dropColumn('collects_count')
	})

	await knex.raw(`
		DROP TRIGGER update_post_counts_trigger ON mirrors;
	`)

	await knex.raw(`
		DROP FUNCTION update_post_counts;
	`)
};
