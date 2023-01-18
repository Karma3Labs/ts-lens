import { request, gql } from 'graphql-request'
import { Profile } from '../types'
import { getEnv, sleep } from '../utils';
import { chunk }  from 'lodash'

const GRAPHQL_URL = getEnv('GRAPHQL_API')

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

export const getProfilesCount = async () => {
	const profilesCount = gql`
		query ExploreProfiles {
			exploreProfiles(request: { sortCriteria: LATEST_CREATED, limit: 50 }) {
				pageInfo {
					totalCount
				}
			}
		}
	`

	const res = await requestGQL(profilesCount)
	return res.exploreProfiles.pageInfo.totalCount
}


export const getProfilesBatch = async (offset = 0): Promise<Profile[]> => {
	const profilesQuery = gql`
		query ExploreProfiles($cursor: Cursor) {
			exploreProfiles(request: { sortCriteria: MOST_FOLLOWERS, cursor: $cursor }) {
				items {
					id
					handle
				}
			}
		}
	`

	const cursor = `{\"offset\": ${offset}}`
	const res = await requestGQL(profilesQuery, { cursor })
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

	const res = await requestGQL(followersCount, { profileId })
	return res.followers.pageInfo.totalCount
}

const getFollowersBatch = async (profileId: string, offset: number): Promise<Profile[]> => {
	const followersQuery = gql`
		query Followers($profileId: ProfileId!, $cursor: Cursor) {
			followers(request: { profileId: $profileId, limit: 50, cursor: $cursor }) {
				items {
					wallet {
						defaultProfile {
							id
							handle
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
	const res = await requestGQL(followersQuery, { profileId, cursor })
	const followers = res.followers.items
	const followerProfiles = followers
		.map((f: Record<string, any>) => { 
			return {
				id: f.wallet?.defaultProfile?.id,
				handle: f.wallet?.defaultProfile?.handle
			} as Profile
		})
		.filter((f: Profile) => f.id != null)

		return followerProfiles
}

export const getFollowers = async (profileId: string): Promise<Profile[]> => {
	const count = await getFollowersCount(profileId)
	let promises: Promise<Profile[]>[] = []
	for (let i = 0; i <= count; i += 50) {
		promises.push(getFollowersBatch(profileId, i))
	}

	const chunks = chunk(promises, 10)
	let followers: Profile[][] = []

	for (const chunk of chunks) {
		const res = await Promise.all(chunk)
		const profiles = res.flat()
		followers.push(profiles)
	}

	return followers.flat()
}
