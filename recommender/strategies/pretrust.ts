import { Pretrust } from '../../types'
import { getDB } from '../../utils';

export type PretrustStrategy = () => Promise<Pretrust>

const db = getDB()

const pretrustAllEqually: PretrustStrategy = async () => {
	return []
}

const pretrustFirstFifty: PretrustStrategy = async () => {
	const ids = await db('profiles').select('id').orderBy('id', 'asc').limit(50)
	const pretrust: Pretrust = []

	ids.forEach(({ id }: { id: number }) => {
		pretrust.push({
			i: id,
			v: 1 / ids.length
		})
	})

	return pretrust
}

const pretrustOGs: PretrustStrategy = async () => {
	const ogs = ["chriscomrie.lens", "christina.lens", "cristinaspinei.lens",
	"bradorbradley.lens", "blackdave.lens", "goodkrak.lens", "levychain.lens",
	"ryanfox.lens", "stani.lens", "jamesfinnerty.lens" ]

	const ids = await db('profiles').select('id').whereIn('handle', ogs)
	const pretrust: Pretrust = []

	ids.forEach(({ id }: { id: number }) => {
		pretrust.push({
			i: id,
			v: 1 / ids.length
		})
	})

	return pretrust
}

export const strategies: Record<string, PretrustStrategy> = {
	pretrustOGs,
	pretrustFirstFifty,
	pretrustAllEqually
}
