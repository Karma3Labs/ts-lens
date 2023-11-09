import { Pretrust } from '../../types'
import { config } from '../config'
import { getDB } from '../../utils';
import { readFile } from 'fs/promises';
import  path from 'path'

export type PretrustStrategy = () => Promise<Pretrust<string>>

const db = getDB()

const pretrustAllEqually: PretrustStrategy = async () => {
	return []
}

const pretrustFirstFifty: PretrustStrategy = async () => {
	const ids = await db('k3l_profiles').select('profile_id').orderBy('profile_id', 'asc').limit(50)
	const pretrust: Pretrust<string> = []

	ids.forEach(({ profileId }: { profileId: string }) => {
		pretrust.push({
			i: profileId,
			v: 1 / ids.length
		})
	})

	return pretrust
}

const pretrustOGs: PretrustStrategy = async () => {
	const ids = await db('k3l_profiles').select('profile_id').whereIn('handle', config.ogs)
	const pretrust: Pretrust<string> = []

	ids.forEach(({ profileId }: { profileId: string }) => {
		pretrust.push({
			i: profileId,
			v: 1 / ids.length
		})
	})

	return pretrust
}

const pretrustCurated: PretrustStrategy = async () => {
	const ids = await db('k3l_curated_profiles').select('profile_id')
	const pretrust: Pretrust<string> = []

	ids.forEach(({ profileId }: { profileId: string }) => {
		pretrust.push({
			i: profileId,
			v: 1 / ids.length
		})
	})

	return pretrust
}

const pretrustCommunity = async(pretrustFile?: string) => {
	const data = await readFile(path.resolve(__dirname, pretrustFile!), 'utf-8')
	const json = JSON.parse(data);
	const profiles = json.data.items
	const pretrust: Pretrust<string> = []

	profiles.forEach(({ profileId }: { profileId: string }) => {
		pretrust.push({
			i: profileId,
			v: 1 / profiles.length
		})		
	})
	return pretrust
}

const pretrustPhotoArt: PretrustStrategy = 
	async(pretrustFile?: string) => pretrustCommunity('../../pretrusts/photoart.json')

export const strategies: Record<string, PretrustStrategy> = {
	pretrustOGs,
	pretrustFirstFifty,
	pretrustAllEqually,
	pretrustCurated,
	pretrustPhotoArt
}
