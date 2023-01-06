import { request, gql } from 'graphql-request'
import { Profile } from '../types'

const GRAPHQL_URL = 'https://api-mumbai.lens.dev'
/**
 * Profiles
*/

export const getProfilesCount = async () => {
	const profilesCount = gql`
		query ExploreProfiles {
			exploreProfiles(request: { sortCriteria: MOST_FOLLOWERS }) {
				pageInfo {
					totalCount
				}
			}
		}
	`

	const res = await request(GRAPHQL_URL, profilesCount)
	return res.exploreProfiles.pageInfo.totalCount
}


export const getProfilesBatch = async (offset = 0): Promise<Profile[]> => {
	const profilesQuery = gql`
		query ExploreProfiles($cursor: Cursor) {
			exploreProfiles(request: { sortCriteria: MOST_FOLLOWERS, cursor: $cursor }) {
				items {
					id
				}
			}
		}
	`

	const cursor = `{\"offset\": ${offset}}`
	const res = await request(GRAPHQL_URL, profilesQuery, { cursor })
	const profiles = res.exploreProfiles.items
	return profiles
}

/**
 * Followers
*/

const getFollowersCount = async (profileId: string) => {
	const followersCount = gql`
		query Followers($profileId: ProfileId!) {
			followers(request: { profileId: $profileId }) {
				pageInfo {
					totalCount
				}
			}
		}
	`

	const res = await request(GRAPHQL_URL, followersCount, { profileId })
	return res.followers.pageInfo.totalCount
}

const getFollowersBatch = async (profileId: string, offset: number) => {
	const followersQuery = gql`
		query Followers($profileId: ProfileId!, $cursor: Cursor) {
			followers(request: { profileId: $profileId, limit: 50, cursor: $cursor }) {
				items {
					wallet {
						defaultProfile {
							id
						}
					}
				}
				pageInfo {
					next
				}
			}
		}
	`

	const cursor = `{\"offset\": ${offset}}`
	const res = await request(GRAPHQL_URL, followersQuery, { profileId, cursor })
	const followers = res.followers.items
	const ids = followers
		.map((f: Record<string, any>) => f.wallet?.defaultProfile?.id)
		.filter((f: string) => f != null)

		return ids
}

export const getFollowers = async (profileId: string): Promise<Profile[]> => {
	const count = await getFollowersCount(profileId)
	let promises: any = []
	for (let i = 0; i <= count; i += 50) {
		promises.push(getFollowersBatch(profileId, i))
	}

	const res = await Promise.all(promises) 
	return res.flat().map((id: string) => {return { id }})
}
