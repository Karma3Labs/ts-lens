import fs from 'fs';
import path from 'path'
import { getFollowees, saveFollows, saveProfiles } from './db'
import { getFollowers, getProfilesBatch, getProfilesCount } from './graphql'


const logLastProfile = (userId: string, totalCounts: number) => {
	const logFile = path.join(__dirname, '..', '..', 'log.txt')
	fs.appendFileSync(logFile, `${userId} logged ${totalCounts} followers`);
}

const main = async () => {
	const count = await getProfilesCount()
	let noFollowersFromNowOn = false
	let followeesScraped = await getFollowees()
	console.log(followeesScraped)

	console.log(`Starting indexing ${count} profiles`)

	for (let i = 0; i <= count; i += 50) {
		console.log(`Working on batch: [${i}, ${i + 50}]`)
		const profiles = await getProfilesBatch(i)
		await saveProfiles(profiles)

		if (noFollowersFromNowOn) {
			// Since we're sorting by followers desc, once we find the first user with no followers
			// all profiles from now on, will not have any followers
			console.log("No followers from now on");
			continue
		}

		for (const profile of profiles) {
			if (followeesScraped.includes(profile.id)) {
				console.log('Aready scraped', profile.id)
				continue
			}
			const followers = await getFollowers(profile.id)
			noFollowersFromNowOn = followers.length == 0 
			await saveFollows(profile, followers)
			console.log(profile.id, followers.length)
			logLastProfile(profile.id, followers.length)
		}
	}
}

main().then(() => console.log('Done'))