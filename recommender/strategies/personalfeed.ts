import { getDB } from '../../utils'
import { Post } from '../../types'

export type PersonalFeedStrategy = (
	limit: number, 
	offset: number, 
	rankLimit: number,
	id:string, 
	contentFocus: string[],
	language: string
	) => Promise<Post[]>

const db = getDB()

export const followingViralFeedWithEngagement = async (
	limit: number, 
	offset: number, 
	rankLimit: number,
	id: string, 
	contentFocus: string[],
	language: string
	) => {
	let contentFocusClause: string = ''
	if (contentFocus && contentFocus.length > 0) {
		contentFocusClause = contentFocus.reduce((acc, cur) => { 
				return acc.concat("'",cur.toUpperCase(),"',");
			},
			"AND main_content_focus IN ("
		)
		contentFocusClause = contentFocusClause.substring(0, contentFocusClause.length - 1) + ")";
	}
	let languageClause: string = ''
	if (language) {
		languageClause = `AND language = '${language}'`
	}

	const res = await db.raw(`
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
					k3l_following_feed AS stats
					LEFT OUTER JOIN
						k3l_follows AS follows
						ON (stats.profile_id = follows.to_profile_id 
									AND follows.profile_id = :id AND follows.to_profile_id != :id)
			WHERE r_num < 10
			${contentFocusClause}
			${languageClause}
			ORDER BY
				following_post DESC, v DESC
			LIMIT LEAST(5000, :offset::integer + :limit::integer)
		) top_posts
		WHERE following_post = 1 OR rank < :rankLimit
		ORDER BY following_post DESC, age_time
		LIMIT :limit OFFSET :offset;
	`, { limit, offset, rankLimit, id })

	return res.rows
}

export const strategies: Record<string, PersonalFeedStrategy> = {
	followingViralFeedWithEngagement,
}
