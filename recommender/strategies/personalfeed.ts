import { getDB } from '../../utils'
import { Post } from '../../types'

export type PersonalFeedStrategy = (limit: number, id:string) => Promise<Post[]>

const db = getDB()

export const followingViralFeedWithEngagement = async (limit: number, id: string) => {
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
					k3l_posts as k3l
					ON publication_id = k3l.post_id
				INNER JOIN 
					profile_post as post
					ON publication_id = post.post_id
			WHERE 
				k3l.created_at > now() - interval '14 days'
				AND post.is_related_to_post IS NULL
				AND post.is_related_to_comment IS NULL
		),
		posts_with_stats AS (
				SELECT
						p.post_id,
						p.content_uri,
						p.profile_id,
						p.created_at,
						ps.total_amount_of_mirrors AS mirrors_count,
						ps.total_amount_of_comments AS comments_count,
						ps.total_amount_of_collects AS collects_count,
						(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.created_at)) / (60 * 60 * 24))::integer AS age_days,
						gt.v AS globaltrust_v
				FROM
						k3l_posts p
				INNER JOIN publication_stats ps 
					ON (ps.publication_id = p.post_id AND 
								(ps.total_amount_of_mirrors + ps.total_amount_of_comments + ps.total_amount_of_collects) > 0)
				INNER JOIN profile_post post ON post.post_id = p.post_id
				INNER JOIN globaltrust gt ON gt.i = p.profile_id
				WHERE
					gt.strategy_name = 'engagement'
				AND
					gt.date = (select max(date) from globaltrust)
				AND
					p.created_at > now() - interval '14 days'
				AND
					post.is_related_to_post IS NULL
				AND 
					post.is_related_to_comment IS NULL
		)
		SELECT
				CASE 
					WHEN (follows.profile_id IS NOT NULL) THEN 1
					ELSE 0
				END as following_post,
				post_id,
				content_uri,
				stats.profile_id,
				stats.created_at,
				mirrors_count,
				comments_count,
				collects_count,
				2 * (comments_count::numeric / max_values.max_comments_count) as comments_weight,
				5 * (mirrors_count::numeric / max_values.max_mirrors_count) as mirrors_weight,
				3 * (collects_count::numeric / max_values.max_collects_count) as collects_weight,
				10 * globaltrust_v as globaltrust_weight,
				2 * (age_days::numeric / max_values.max_age_days) as days_weight,
				age_days,
				(
						2 * (comments_count::numeric / max_values.max_comments_count) +
						5 * (mirrors_count::numeric / max_values.max_mirrors_count) +
						3 * (collects_count::numeric / max_values.max_collects_count) +
						10 * globaltrust_v -
						2 * (age_days::numeric / max_values.max_age_days)
				) AS v
		FROM
				posts_with_stats AS stats
        CROSS JOIN max_values
      	LEFT OUTER JOIN
      		k3l_follows AS follows
      		ON (stats.profile_id = follows.to_profile_id AND follows.profile_id = :id)
		ORDER BY
			following_post DESC,v DESC
		LIMIT :limit;
	`, { limit, id })

	return res.rows
}

export const strategies: Record<string, PersonalFeedStrategy> = {
	followingViralFeedWithEngagement,
}
