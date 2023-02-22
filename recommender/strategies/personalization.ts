import { Entry, ParsedGlobaltrust } from "../../types";

export type PersonalizationStrategy = (globalTrust: ParsedGlobaltrust, limit: number) => Promise<number[]>

const useFollows: PersonalizationStrategy = async (globaltrust: ParsedGlobaltrust, limit: number): Promise<number[]> => {
	return Object.keys(globaltrust).slice(limit).map(parseInt)
}

export const strategies: Record<string, PersonalizationStrategy> = {
	useFollows
}