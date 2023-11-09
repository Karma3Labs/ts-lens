import { getDB } from '../../utils'
import { Post } from '../../types'

export type FeedStrategy = (limit: number) => Promise<Post[]>

const db = getDB()

export const viralFeedWithEngagement:FeedStrategy = 
	async (limit: number) => viralFeedWithStrategy('engagement', limit)

export const viralFeedWithPhotoArt:FeedStrategy = 
	async (limit: number) => viralFeedWithStrategy('photoart', limit)


export const viralFeedWithStrategy = async (strategyName:string, limit: number) => {
	/* 
	Find the max number of comments, collects and mirrors of all posts withing the last 14 days.
	Find the max age of all posts within the last 14 days. (redundant)
	Compute a score v that combines the globaltrust score of the author with the 
	normalized (over max) number of comments, collects nad mirrors of the posts.
	Note: we use the inverse of the log of globaltrust score to deal with very small numbers (e-93)
	Compute a row number r_num for all posts for each author. 
	This r_num will be used to ensure we don't return more than 10 posts per author.
	Return posts ordered by v making sure we don't return more than 10 posts per author.
	*/
	const res = await db.raw(`
		WITH posts_with_stats AS (	
			SELECT
				*,
				ROW_NUMBER() OVER (PARTITION BY profile_id ORDER BY v DESC) AS r_num
				FROM (
					SELECT 
							p.post_id,
							p.content_uri,
							p.profile_id,
							p.created_at,
							ps.total_amount_of_mirrors AS mirrors_count,
							ps.total_amount_of_comments AS comments_count,
							ps.total_amount_of_collects AS collects_count,
							(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.created_at)) / (60 * 60 * 24))::integer AS age_days,
							(
									4 * (ps.total_amount_of_comments::numeric / max_values.max_comments_count) +
									2 * (ps.total_amount_of_mirrors::numeric / max_values.max_mirrors_count) +
									8 * (ps.total_amount_of_collects::numeric / max_values.max_collects_count) +
									10 * 1/abs(log(gt.v)) -
									2 * ((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.created_at)) / (60 * 60 * 24))::integer
																														/ max_values.max_age_days)
							) AS v,
							gt.v AS globaltrust_v	
					FROM
							(
								SELECT
										MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - k3l.created_at))/(60*60*24))::integer AS max_age_days,
										MAX(total_amount_of_mirrors) AS max_mirrors_count,
										MAX(total_amount_of_comments) AS max_comments_count,
										MAX(total_amount_of_collects) AS max_collects_count
								FROM
										publication_stats
									INNER JOIN
										k3l_posts AS k3l
										ON publication_id = k3l.post_id
									INNER JOIN 
										profile_post AS post
										ON publication_id = post.post_id
								WHERE 
									k3l.created_at > now() - interval '14 days'
									AND post.is_related_to_post IS NULL
									AND post.is_related_to_comment IS NULL
						) max_values,
							k3l_posts p
					INNER JOIN publication_stats ps 
						ON (ps.publication_id = p.post_id 
									AND (ps.total_amount_of_mirrors + ps.total_amount_of_comments + ps.total_amount_of_collects) > 0
									AND p.created_at > now() - interval '14 days')
					INNER JOIN profile_post post 
						ON (post.post_id = p.post_id
								AND p.created_at > now() - interval '14 days'
								AND post.is_related_to_post IS NULL
								AND post.is_related_to_comment IS NULL)
					INNER JOIN globaltrust gt 
						ON (gt.i = p.profile_id
								AND p.created_at > now() - interval '14 days'
								AND gt.strategy_name = :strategyName
								AND gt.date = (select max(date) from globaltrust))
					ORDER BY p.profile_id, v DESC
				) AS pstats)
		SELECT
				r_num,
				post_id,
				content_uri,
				profile_id,
				created_at,
				mirrors_count,
				comments_count,
				collects_count,
				age_days,
				v
		FROM
			posts_with_stats
		WHERE r_num < 10
		ORDER BY
				v DESC
		LIMIT :limit;
	`, { strategyName, limit })

	return res.rows
}

export const latestFeed:FeedStrategy = async (limit: number) => {
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

export const strategies: Record<string, FeedStrategy> = {
	viralFeedWithEngagement,
	viralFeedWithPhotoArt,
	latestFeed,
}
