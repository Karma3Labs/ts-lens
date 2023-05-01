import yargs from 'yargs'
import path from 'path'
import fs from 'fs'
import { getDB } from '../utils'
import RankingsRecommender from '../recommender/RankingsRecommender'
import { getIds } from '../recommender/utils'

const db = getDB()

const main = async () => {
	const argv = yargs
		.scriptName("./scripts/getGlobalTrust.ts")
		.usage('$0 [args]')
		.option('pretrust', {
			describe: 'Strategy that should be used to generate pretrust. The strategy should exist in recommender/strategies/pretrust.ts file and should not be personalized',
			type: 'string',
			default: 'pretrustAllEqually',
		})
		.option('localtrust', {
			describe: 'Strategy that should be used to generate localtrust. The strategy should exist in recommender/strategies/localtrust.ts file',
			type: 'string',
			default: 'enhancedConnections',
		})
		.option('alpha', {
			describe: 'A weight denoting how much the pretrust should affect the global trust',
			type: 'number',
			default: 0.5,
		})
		.help()
		.argv as { pretrust: string, localtrust: string, alpha: number }
	

	console.log(`Getting global trust for pretrust: ${argv.pretrust}, localtrust: ${argv.localtrust}, alpha: ${argv.alpha}`)

	const globaltrust = await RankingsRecommender.calculateByStrategy(
		await getIds(),
		{ pretrust: argv.pretrust, localtrust: argv.localtrust, alpha: argv.alpha },
		false
	)
 	//recommender.globaltrust = [{i: 1, v: 2}, {i: 3, v: 1}, {i: 2, v: 0.5}]


	console.log("Calculation finished. Saving to CSV...")
	const ids = globaltrust.map((t: any) =>  t.i)

	const profiles = await db.raw(`select profiles.id, handle from profiles join unnest('{${ids.join(',')}}'::int[]) with ordinality t(id,ord) using (id) order by t.ord`)

	let csv = 'id,handle\n'
	csv += profiles.rows.map((r: any) => `${r.id},${r.handle}`).join('\n')
	fs.writeFileSync(path.join(__dirname, '../../globaltrust.csv'), csv)

	console.log('Done! (see globaltrust.csv)')
	process.exit()
}

main()