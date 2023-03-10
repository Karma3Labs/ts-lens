import yargs from 'yargs'
import Recommender from '../recommender'
import serve from '../server/index'
import { strategies as psStrategies } from '../recommender/strategies/personalization'
import { getDB } from '../utils'

const db = getDB()

const main = async () => {
	const argv = yargs
		.scriptName("./scripts/start-server.ts")
		.usage('$0 [args]')
		.option('pretrust', {
			describe: 'Strategy that should be used to generate pretrust. The strategy should exist in recommender/strategies/pretrust.ts file',
			type: 'string',
			default: 'pretrustOGs',
		}) 
		.option('localtrust', {
			describe: 'Strategy that should be used to generate localtrust. The strategy should exist in recommender/strategies/localtrust.ts file',
			type: 'string',
			default: 'existingConnections',
		}) 
		.option('personalization', {
			describe: 'Strategy that should be used to generate personalized results from the global trust.',
			type: 'string',
			default: 'useFollowsRecursive',
		}) 
		.option('alpha', {
			describe: 'A weight denoting how much the pretrust should affect the global trust',
			type: 'number',
			default: 0.5,
		})
		.help()
		.argv as { pretrust: string, localtrust: string, personalization: string, alpha: number }

	const { id } = await db('strategies')
		.where({ pretrust: argv.pretrust, localtrust: argv.localtrust, alpha: argv.alpha })
		.first('id')

	if (!id) {
		console.error('Strategy not found in DB. Please run the compute script first.')
		process.exit(1)
	}

	const personalizationStrategy = psStrategies[argv.personalization]
	console.log('Using personalization strategy:', argv.personalization)

	try {
		const recommender = new Recommender(id, personalizationStrategy)
		await recommender.loadFromDB()

		serve(recommender)
	}
	catch (e: any) {
		console.error(e?.message)
		process.exit()
	}
}

main()