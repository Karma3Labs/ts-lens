import { saveFollows, saveProfiles } from './db'
import { getFollowers, getProfilesBatch, getProfilesCount } from './graphql'

const main = async () => {
	const count = await getProfilesCount()
	let noFollowersFromNowOn = false

	console.log(`Starting indexing ${count} profiles`)

	for (let i = 0; i <= count; i += 50) {
		console.log(`Working on batch: [${i}, ${i + 50}]`)
		const profiles = await getProfilesBatch(i)
		console.log(`Working on batch: [${i}, ${i + 50}]`)
		await saveProfiles(profiles)

		if (noFollowersFromNowOn) {
			// Since we're sorting by followers desc, once we find the first user with no followers
			// all profiles from now on, will not have any followers
			console.log("No followers from now on");
			continue
		}

		for (const profile of profiles) {
			const followers = await getFollowers(profile.id)
			noFollowersFromNowOn = followers.length == 0 
			await saveFollows(profile, followers)
		}
	}
}

main()