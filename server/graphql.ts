import { request, gql } from 'graphql-request'

const GRAPHQL_URL = 'https://api.lens.dev'

export const getFullProfiles = async (profileIds: string[]) => {
	const query = gql`
		query ProfileIds($profileIds: [ProfileId!]) {
			profiles(request: { profileIds: $profileIds }) {
				items {
					id,
					handle
				}
			}
		}
	  `

	const res = await request(GRAPHQL_URL, query, { profileIds })
	return res.profiles.items
}

getFullProfiles(['0x01'])

