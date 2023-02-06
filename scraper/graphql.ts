import { request, gql } from 'graphql-request'
import { Post, Profile } from '../types'
import { getEnv, sleep } from '../utils';
import { chunk }  from 'lodash'

const GRAPHQL_URL = 'https://api.thegraph.com/subgraphs/name/rtomas/lens-subgraph'

const requestGQL = async (query: string, variables: object = {}) => {
	while (true) {
		try {
			return await request(GRAPHQL_URL, query, variables)
		}
		catch (error: any) {
			console.log('ERROR', error)
			if (error.response.status == 429) {
				console.log('Rate limited. Sleeping 10s')
				await sleep(60000)
			}
			else {
				console.log(error)
			}
		}

		console.log('Trying again')
		// Sometimes the API stucks, or we get rate limited so why not try again
		await sleep(1000)
	}
}

/**
 * Profiles
*/

export const getStats = async () => {
	const profilesCount = gql`
		query stats {
			stats {
				totalProfiles
				totalPosts
				totalMirror
				totalComments
			}
		}
	`

	const res = await requestGQL(profilesCount)
	return { 
		totalProfiles: +res.stats[0].totalProfiles,
		totalPosts: +res.stats[0].totalPosts,
		totalMirror: +res.stats[0].totalMirror,
		totaalComments: +res.stats[0].totalComments,
	}
}

export const getProfilesBatch = async (skip = 0, first = 100): Promise<Profile[]> => {
	const profilesQuery = gql`
		query Profiles($first: Int, $skip: Int) {
			profiles(first: $first, skip: $skip) {
				id
				handle
				followings(first: $first) { id }
				createdAt
			}
		}
	`
	const followersQuery = gql`
		query Profile($id: ID, $first: Int, $skip: Int) {
			profile(id: $id) {
				followings(first: $first, skip: $skip) { id }
			}
		}
	`

	const { profiles } = await requestGQL(profilesQuery, { skip, first })
	for (const profile of profiles)  {
		if (profile.followings.length == first) {
			console.log(`More than ${first} followings for profile ${profile.id}`)

			let skip = first
			let res: any
			const moreFollowings = []

			do {
				res = await requestGQL(followersQuery, { id: profile.id, skip, first })
				moreFollowings.push(...res.profile.followings)
				skip += first
			}
			while (res.profile.followings.length == first)

			profile.followings.push(...moreFollowings);
		}

		console.log('Fetched followings for profile', profile.id, profile.followings.length)

		profile.followings = profile.followings.map((f: any) => +f.id)
		profile.createdAt = new Date(+profile.createdAt * 1000)
		profile.id = +profile.id
	}

	return profiles
}

const getPostsBatch = async (skip: number, first = 100): Promise<Post[]> => {
	const postsQuery = gql`
		query Posts($first: Int, $skip: Int) {
			posts(first: $first, skip: $skip) {
				id,
				pubId
				timestamp
				fromProfile {
					id
				}
			}
		}
	`

	const res = await requestGQL(postsQuery, { first, skip})
	const posts = res.posts.map((p: any) => {
		return {
			id: p.id,
			pubId: +p.pubId,
			fromProfile: +p.fromProfile.id,
			timestamp: new Date(+p.timestamp * 1000),
		}
	})

	return posts
}

const getCommentsBatch = async (skip: number, first = 100): Promise<Comment[]> => {
	const commentsQuery = gql`
		query Comments($first: Int, $skip: Int) {
			comments(first: $first, skip: $skip) {
				id,
				pubId
				timestamp
				profileIdPointed
				pubIdPointed
				fromProfile {
					id
				}
			}
		}
	`

	const res = await requestGQL(commentsQuery, { first, skip })
	const comments = res.comments.map((p: any) => {
		return {
			id: p.id,
			pubId: +p.pubId,
			pubIdPointed: +p.pubIdPointed,
			profileIdPointed: +p.pubIdPointed,
			fromProfile: +p.fromProfile.id,
			timestamp: new Date(+p.timestamp * 1000),
		}
	})

	return comments
}

const getMirrorsBatch = async (skip: number, first = 100): Promise<Comment[]> => {
	const mirrorsQuery = gql`
		query Mirrors($first: Int, $skip: Int) {
			mirrors(first: $first, skip: $skip) {
				id,
				pubId
				timestamp
				profileIdPointed
				pubIdPointed
				fromProfile {
					id
				}
			}
		}
	`

	const res = await requestGQL(mirrorsQuery, { first, skip })
	const mirrors = res.mirrors.map((p: any) => {
		return {
			id: p.id,
			pubId: +p.pubId,
			pubIdPointed: +p.pubIdPointed,
			profileIdPointed: +p.pubIdPointed,
			fromProfile: +p.fromProfile.id,
			timestamp: new Date(+p.timestamp * 1000),
		}
	})

	return mirrors
}

getMirrorsBatch(0).then(console.log)
