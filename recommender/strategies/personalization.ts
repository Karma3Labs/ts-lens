import { GlobalTrust } from "../../types"
import { getDB } from "../../utils"

const db = getDB()

export type PersonalizationStrategy = (globalTrust: GlobalTrust, strategyId: number, id: number, limit: number) => Promise<number[]>

/**
 * Multiplies the global trust by 5 if the profile is followed by the user
*/
const useFollows: PersonalizationStrategy = async (globaltrust: GlobalTrust, strategyId: number, id: number, limit: number): Promise<number[]> => {
	const { rows } = await db.raw(`
	with profile_follows as (
		select profiles.id as following_id,
		profile_id as follower_id
		from profiles
		inner join
			follows
		on
			profiles.owner_address = follows.follower_address
		where
			profile_id = :id:
	)
	select 
		i, v * case when follower_id = :id: then 5 else 1 end AS trust
	from globaltrust
		left join
			profile_follows
		on globaltrust.i = profile_follows.following_id
	order by
		trust desc
	limit :limit:
	`, { id, limit }) as  { rows: { i: number, trust: number }[] }

	return rows.map(({ i }: {i: number}) => i)
}

export const strategies: Record<string, PersonalizationStrategy> = {
	useFollows
}