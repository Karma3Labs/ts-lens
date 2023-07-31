import { getDB } from '../../utils'
import { Post } from '../../types'

export type PersonalFeedStrategy = (limit: number, offset: number, id:string) => Promise<Post[]>

const db = getDB()

export const followingViralFeedWithEngagement = async (limit: number, offset: number, id: string) => {
	const res = await db.raw(`
		WITH posts_with_stats AS (
			SELECT
				*,
				ROW_NUMBER() OVER (partition by profile_id ORDER BY v desc) AS r_num
				FROM (
					SELECT	
							p.post_id,
							p.content_uri,
							p.profile_id,
							p.created_at,
							prof.handle,
							ps.total_amount_of_mirrors AS mirrors_count,
							ps.total_amount_of_comments AS comments_count,
							ps.total_amount_of_collects AS collects_count,
							ps.total_upvotes AS upvotes_count,
							(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.created_at)))::integer AS age_time,
							(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.created_at)) / (60 * 60 * 24))::integer AS age_days,
							(
								2 * (ps.total_amount_of_comments::numeric / max_values.max_comments_count) +
								5 * (ps.total_amount_of_mirrors::numeric / max_values.max_mirrors_count) +
								3 * (ps.total_amount_of_collects::numeric / max_values.max_collects_count) +
								0.5 * (ps.total_upvotes::numeric / max_values.max_upvotes_count) +
								10 * gt_v -
								2 * ((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.created_at)) / (60 * 60 * 24))::integer
																												/ max_values.max_age_days)
							) AS v,
							rank
					FROM
							(
								SELECT
										MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/(60*60*24))::integer AS max_age_days,
										MAX(total_amount_of_mirrors) AS max_mirrors_count,
										MAX(total_amount_of_comments) AS max_comments_count,
										MAX(total_amount_of_collects) AS max_collects_count,
										MAX(total_upvotes) AS max_upvotes_count
								FROM
										publication_stats
									INNER JOIN
										k3l_posts as k3l
										ON publication_id = k3l.post_id
									INNER JOIN 
										profile_post as post
										ON publication_id = post.post_id
								WHERE 
									k3l.created_at > now() - interval '30 days'
									AND post.is_related_to_post IS NULL
									AND post.is_related_to_comment IS NULL
							) max_values,
							k3l_posts p
					INNER JOIN publication_stats ps 
						ON (ps.publication_id = p.post_id AND 
									(ps.total_amount_of_mirrors + ps.total_amount_of_comments 
										+ ps.total_amount_of_collects + ps.total_upvotes) > 0)
					INNER JOIN profile_post post ON post.post_id = p.post_id
					INNER JOIN ( 
						SELECT 
							ROW_NUMBER() OVER (ORDER BY v DESC) AS rank,
							v as gt_v,
							i as profile_id
						FROM globaltrust
						WHERE 
							strategy_name = 'engagement'
							AND date = (select max(date) from globaltrust)
			 		) as gt ON (gt.profile_id = p.profile_id)
					INNER JOIN k3l_profiles prof ON prof.profile_id = p.profile_id
					WHERE
						p.created_at > now() - interval '30 days'
					AND
						post.is_related_to_post IS NULL
					AND 
						post.is_related_to_comment IS NULL
					ORDER BY p.profile_id, v DESC
			) AS pstats
		)
		SELECT 
			* 
		FROM (
			SELECT
					CASE 
						WHEN (follows.profile_id IS NOT NULL) THEN 1
						ELSE 0
					END as following_post,
					rank,
					post_id,
					content_uri,
					stats.handle,
					stats.created_at,
					mirrors_count,
					comments_count,
					collects_count,
					upvotes_count,
					v,
					age_time,
					age_days
			FROM
					posts_with_stats AS stats
					LEFT OUTER JOIN
						k3l_follows AS follows
						ON (stats.profile_id = follows.to_profile_id 
									AND follows.profile_id = :id AND follows.to_profile_id != :id)
			WHERE r_num < 10
			ORDER BY
				following_post DESC, v DESC
			LIMIT 5 * :limit
		) top_posts
		ORDER BY following_post DESC, age_time
		LIMIT :limit OFFSET :offset;
	`, { limit, offset, id })

	return res.rows
}

export const strategies: Record<string, PersonalFeedStrategy> = {
	followingViralFeedWithEngagement,
}
