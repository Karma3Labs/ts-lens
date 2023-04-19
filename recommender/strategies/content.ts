import { getDB } from '../../utils'

export type ContentStrategy = (fromUsers: number[], limit: number) => Promise<number[]>

const db = getDB()

export const viralPosts = async (fromUsers: number[], limit: number) => {
	const res = await db.raw(`
		WITH hot_posts AS (
			SELECT 
				posts.id,
				posts.content_uri,
				posts.profile_id, 
				posts.pub_id, 
				posts.block_timestamp as timestamp,
				COALESCE(num_mirrors, 0) AS num_mirrors, 
				COALESCE(num_comments, 0) AS num_comments,
				COALESCE(num_collects, 0) AS num_collects,
				EXTRACT(epoch FROM NOW() - posts.block_timestamp) / 3600 AS age_hours,
				(0.5 * COALESCE(num_mirrors, 0)) + (0.2 * COALESCE(num_collects, 0)) + (0.5 * COALESCE(num_comments, 0)) - (1 * (EXTRACT(epoch FROM NOW() - posts.block_timestamp) / 3600)) AS weighted_average
			FROM posts
			LEFT JOIN (
				SELECT to_profile_id, to_pub_id, COUNT(*) as num_mirrors 
				FROM mirrors 
				GROUP BY to_profile_id, to_pub_id
			) mirrors_count ON posts.profile_id = mirrors_count.to_profile_id AND posts.pub_id = mirrors_count.to_pub_id
			LEFT JOIN (
				SELECT to_profile_id, to_pub_id, COUNT(*) as num_comments 
				FROM comments 
				GROUP BY to_profile_id, to_pub_id
			) comments_count ON posts.profile_id = comments_count.to_profile_id AND posts.pub_id = comments_count.to_pub_id
			LEFT JOIN (
				SELECT profile_id, pub_id, COUNT(*) as num_collects 
				FROM collects
				where price > 0
				GROUP BY profile_id, pub_id
			) collects_count ON posts.profile_id = collects_count.profile_id AND posts.pub_id = collects_count.pub_id
			WHERE posts.profile_id IN (${fromUsers.join(', ')})
			ORDER BY weighted_average DESC
		)
	SELECT id, content_uri, profile_id, pub_id, timestamp FROM hot_posts limit :limit
	`, { limit })

	return res.rows
}

export const strategies: Record<string, ContentStrategy> = {
	viralPosts,
}
