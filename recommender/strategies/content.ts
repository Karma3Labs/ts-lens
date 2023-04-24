import { getDB } from '../../utils'

export type ContentStrategy = (fromUsers: number[], limit: number) => Promise<number[]>

const db = getDB()

export const viralPosts = async (fromUsers: number[], limit: number) => {
	const res = await db.raw(`
		WITH max_values AS (
			SELECT
				MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - block_timestamp))/(60*60*24))::integer AS max_age_days,
				MAX(mirrors_count) AS max_mirrors_count,
				MAX(comments_count) AS max_comments_count,
				MAX(collects_count) AS max_collects_count
			FROM
				posts
		)
		
		SELECT
			id,
			content_uri,
			profile_id,
			pub_id,
			block_timestamp as timestamp,
			mirrors_count,
			comments_count,
			collects_count,
			(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - block_timestamp))/(60*60*24))::integer AS age_days,
			(1 * (mirrors_count::numeric / max_values.max_mirrors_count) +
			1 * (collects_count::numeric / max_values.max_collects_count) +
			3 * (comments_count::numeric / max_values.max_comments_count) -
			5 * ((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - block_timestamp))/(60*60*24))::integer::numeric / max_values.max_age_days)
			) AS score
		FROM
			posts, max_values
		ORDER BY
			score DESC
		LIMIT :limit;

	`, { limit })

	return res.rows
}

export const strategies: Record<string, ContentStrategy> = {
	viralPosts,
}
