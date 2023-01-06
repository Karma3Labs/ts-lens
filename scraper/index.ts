import { saveFollows, saveProfiles } from './db'
import { getFollowers, getProfilesBatch, getProfilesCount } from './graphql'

const main = async () => {
	const count = await getProfilesCount()
	console.log(`Starting indexing ${count} profiles`)

	for (let i = 0; i <= count; i += 50) {
		console.log(`Working on batch: [${i}, ${i + 50}]`)
		const profiles = await getProfilesBatch(i)
		await saveProfiles(profiles)

		for (const profile of profiles) {
			const followers = await getFollowers(profile.id)
			await saveFollows(profile, followers)
		}
	}
}

main()