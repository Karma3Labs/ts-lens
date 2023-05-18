import { getDB } from '../../utils'
import { Post } from '../../types'

export type ContentStrategy = (fromUsers: string[], limit: number) => Promise<Post[]>

const db = getDB()

const toSQLList = (arr: string[]) => arr.map((el) => `'${el}'`).join(",")

export const viralPosts = async (fromUsers: string[], limit: number) => {
	const res = await db.raw(`
		WITH max_values AS (
			SELECT
				MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/(60*60*24))::integer AS max_age_days,
				MAX(total_amount_of_mirrors) AS max_mirrors_count,
				MAX(total_amount_of_comments) AS max_comments_count,
				MAX(total_amount_of_collects) AS max_collects_count
			FROM
				publication_stats
			INNER JOIN
				k3l_posts
			ON publication_id = post_id
			WHERE profile_id IN (${toSQLList(fromUsers)})
		),
		posts_with_stats AS (
			SELECT
				post_id,
				content_uri,
				profile_id,
				created_at,
				total_amount_of_mirrors as mirrors_count,
				total_amount_of_comments as comments_count,
				total_amount_of_collects as collects_count,
				(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/(60*60*24))::integer AS age_days
			FROM
				k3l_posts
			INNER JOIN publication_stats
			ON publication_id = k3l_posts.post_id
			WHERE profile_id IN (${toSQLList(fromUsers)})	
		)
		SELECT
			post_id,
			content_uri,
			profile_id,
			created_at,
			mirrors_count,
			comments_count,
			collects_count,
			age_days,
			(
				1 * (mirrors_count::numeric / max_values.max_mirrors_count) +
				1 * (collects_count::numeric / max_values.max_collects_count) +
				3 * (comments_count::numeric / max_values.max_comments_count) -
				5 * ((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/(60*60*24))::integer::numeric / max_values.max_age_days)
			) AS v
		FROM
			posts_with_stats, max_values
		WHERE profile_id IN (${toSQLList(fromUsers)})
		ORDER BY
			v DESC
		LIMIT :limit;

	`, { limit })

	return res.rows
}

export const latest = async (fromUsers: string[], limit: number) => {
	const res = await db.raw(`
		WITH posts_with_stats AS (
			SELECT
				post_id,
				content_uri,
				profile_id,
				created_at,
				total_amount_of_mirrors as mirrors_count,
				total_amount_of_comments as comments_count,
				total_amount_of_collects as collects_count
			FROM
				k3l_posts
			INNER JOIN publication_stats
			ON publication_id = k3l_posts.post_id
			ORDER BY
				created_at DESC
			LIMIT :limit
		)
		SELECT
			post_id,
			content_uri,
			profile_id,
			created_at,
			mirrors_count,
			comments_count,
			collects_count
		FROM
			posts_with_stats
		ORDER BY
			created_at DESC
		LIMIT :limit;

	`, { limit })

	return res.rows
}

export const strategies: Record<string, ContentStrategy> = {
	viralPosts,
	latest,
}
