import { getDB } from '../utils'
import { readdirSync } from 'fs'
const db = getDB()

const migrateDown = async () => {
	await db.raw(`
		DROP TABLE IF EXISTS public.lenshub_evt_followed;
		DROP TABLE IF EXISTS public.lenshub_evt_commentcreated;
		DROP TABLE IF EXISTS public.lenshub_evt_mirrorcreated;
		DROP TABLE IF EXISTS public.lenshub_evt_postcreated;
		DROP TABLE IF EXISTS public.lenshub_evt_profilecreated;
	`)
}

const migrateUp = async () => {
	await db.raw(`
		CREATE TABLE public.lenshub_evt_commentcreated (
			collectmodule text,
			collectmodulereturndata text,
			contenturi text,
			contract_address text,
			evt_block_number text,
			evt_block_time text,
			evt_index text,
			evt_tx_hash text,
			profileid text,
			profileidpointed text,
			pubid text,
			pubidpointed text,
			referencemodule text,
			referencemoduledata text,
			referencemodulereturndata text,
			timestamp text
		);
		
		DROP TABLE IF EXISTS public.lenshub_evt_followed;
		CREATE TABLE public.lenshub_evt_followed (
			contract_address text,
			evt_block_number text,
			evt_block_time text,
			evt_index text,
			evt_tx_hash text,
			followmoduledatas text,
			follower text,
			profileids text,
			timestamp text
		);
		
		DROP TABLE IF EXISTS public.lenshub_evt_mirrorcreated;
		CREATE TABLE public.lenshub_evt_mirrorcreated (
			contract_address text,
			evt_block_number text,
			evt_block_time text,
			evt_index text,
			evt_tx_hash text,
			profileid text,
			profileidpointed text,
			pubid text,
			pubidpointed text,
			referencemodule text,
			referencemoduledata text,
			referencemodulereturndata text,
			timestamp text
		);
		
		DROP TABLE IF EXISTS public.lenshub_evt_postcreated;
		CREATE TABLE public.lenshub_evt_postcreated (
			collectmodule text,
			collectmodulereturndata text,
			contenturi text,
			contract_address text,
			evt_block_number text,
			evt_block_time text,
			evt_index text,
			evt_tx_hash text,
			profileid text,
			pubid text,
			referencemodule text,
			referencemodulereturndata text,
			timestamp text
		);
		
		DROP TABLE IF EXISTS public.lenshub_evt_profilecreated;
		CREATE TABLE public.lenshub_evt_profilecreated (
			contract_address text,
			creator text,
			evt_block_number text,
			evt_block_time text,
			evt_index text,
			evt_tx_hash text,
			followmodule text,
			followmodulereturndata text,
			follownfturi text,
			handle text,
			imageuri text,
			profileid text,
			timestamp text,
			_to text
		);
	`)
}

const copyCSVDirToDB = async (path: string, table: string) => {
	const files = readdirSync(`${__dirname}/${path}`)
	for (const file of files) {
		await db.raw(`
			COPY
				${table}
			FROM
				'${__dirname}/${path}/${file}'
			DELIMITER ','
			CSV HEADER;`
		)
	}
};

const main = async () => {
	const pathsAndTables = [[
		'../lenshub/LensHub_evt_ProfileCreated',
		'lenshub_evt_profilecreated'
	], [
		'../lenshub/LensHub_evt_PostCreated',
		'lenshub_evt_postcreated'
	], [
		'../lenshub/LensHub_evt_MirrorCreated',
		'lenshub_evt_mirrorcreated'
	], [
		'../lenshub/LensHub_evt_Followed',
		'lenshub_evt_followed'
	], [
		'../lenshub/LensHub_evt_CommentCreated',
		'lenshub_evt_commentcreated'
	]]

	console.log('Migration down')
	await migrateDown()
	console.log('Migration up')
	await migrateUp()

	for (const [path, table] of pathsAndTables) {
		console.log(`Copying ${path} to ${table}`)
		await copyCSVDirToDB(path, table)
	}

	await db.raw(`insert into profiles (id, handle, _to, created_at) select profileid::int, handle, _to, to_timestamp(timestamp::int) from lenshub_evt_profilecreated`)
	await db.raw(`insert into posts (profile_id) select t.profileid::int from lenshub_evt_postcreated t;`)
	await db.raw(`insert into comments (profile_id, profile_id_pointed) select profileid::int, profileidpointed::int from lenshub_evt_commentcreated;`)
	await db.raw(`insert into mirrors (profile_id, profile_id_pointed) select profileid::int, profileidpointed::int from lenshub_evt_mirrorcreated;`)
	await db.raw(`insert into follows (follower, profile_ids) select follower, string_to_array(regexp_replace(profileids, '[^0-9,]', '', 'g'), ',')::int[] from lenshub_evt_followed;`)
	

}

main().then(() => console.log('done'))