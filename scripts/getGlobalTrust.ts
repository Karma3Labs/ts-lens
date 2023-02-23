import yargs from 'yargs'
import path from 'path'
import fs from 'fs'
import { getDB } from '../utils'

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

	const globaltrust = await db('globaltrust')
		.select('id', 'handle', 'v')
		.innerJoin('profiles', 'profiles.id', 'globaltrust.i')
		.where({ pretrust: argv.pretrust, localtrust: argv.localtrust, alpha: argv.alpha })
		.orderBy('v', 'desc')

	if (globaltrust.length === 0) {
		console.log("No global trust found for the given parameters. Consider running `yarn compute`")
		return
	}

	let csv = 'id,handle,globalTrust\n'
	csv += globaltrust.map((r: any) => `${r.id},${r.handle},${r.v}`).join('\n')
	fs.writeFileSync(path.join(__dirname, '../../globaltrust.csv'), csv)
	


	console.log('Done! (see globaltrust.csv)')
	process.exit()
}

main()