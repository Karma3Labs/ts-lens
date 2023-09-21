import fs from 'fs';
import * as fastcsv from 'fast-csv';
import axios from "axios"
import { config }from './config'
import { strategies } from './strategies/localtrust'
import { getIds, objectFlip } from './utils'
import { getDB } from '../utils'
import { LocalTrust } from '../types'

const db = getDB()

export default class LocaltrustGenerator {
	public localtrustStrategies: string[]
	public ids: string[]
	public schema: string

	constructor(schema: string, ids: string[] = []) {
		this.ids = ids
		this.localtrustStrategies = config.localtrustStrategies
		this.schema = schema
	}

	async compute() {
		for (const name of this.localtrustStrategies) {
			console.log(`Generate localtrust for ${name}`)
			const localtrust = await this.generateLocaltrust(name)

			console.log(`Save localtrust for ${name}`)
			await this.saveLocaltrust(name, localtrust, this.schema)

			console.log(`Upload localtrust for ${name}`)
			await this.uploadLocaltrust(name, localtrust, this.ids, this.schema)
		}
	}

	async generateLocaltrust(name: string) {
		if (!strategies[name]) throw new Error(`Strategy ${name} not found`)

		const localtrustStrategy = strategies[name]
		const localtrust = await localtrustStrategy()

		console.log(`Generated localtrust with ${localtrust.length} entries`)

		return localtrust
	}

	async saveLocaltrust(strategyName: string, localtrust: LocalTrust<string>, schema: string) {
		// Delete previous records
		await db(`${schema}.localtrust`).where({ strategy_name: strategyName }).del();
		console.log(`Deleted previous localtrust for strategy ${schema}.${strategyName}`);

		// Generate CSV File
		const timestamp = new Date().toISOString();
		const csvFileName = `/tmp/localtrust_${strategyName}_${timestamp}.csv`;
		const csvStream = fastcsv.write([], { headers: ['i', 'j', 'v'] });
		const writableStream = fs.createWriteStream(csvFileName);

		csvStream.pipe(writableStream);

		for (const record of localtrust) {
			csvStream.write({ i: record.i, j: record.j, v: record.v });
		}
		csvStream.end();

		// Wait for CSV to be fully written
		writableStream.on('finish', async () => {
			try {
				// Read the CSV file line by line and insert into DB
				const stream = fs.createReadStream(csvFileName);
				const csvData: any[] = [];
				fastcsv
					.parseStream(stream, { headers: true })
					.on('data', function (record) {
						csvData.push({ strategyName, ...record });
					})
					.on('end', async function () {
						// Now you have csvData populated, insert it in chunks into the database
						const CHUNK_SIZE = 10000;
						for (let i = 0; i < csvData.length; i += CHUNK_SIZE) {
							const chunk = csvData.slice(i, i + CHUNK_SIZE);
							await db(`${schema}.localtrust`).insert(chunk);
						}
						console.log('Insert completed');

						// Remove temporary CSV file after operation
						fs.unlinkSync(csvFileName);
					});
			} catch (err) {
				console.error('Error in saving data:', err);
				// Remove temporary CSV file in case of an error
				fs.unlinkSync(csvFileName);
			}
		});
	}

	async uploadLocaltrust(strategyName: string, localtrust: LocalTrust<string>, ids: string[] = [], schema: string) {
		const CHUNK_SIZE = 2500000
		if (!ids.length) {
				ids = await getIds()
		}

		console.log(`Converting localtrust for strategy ${strategyName} to ids`)
		console.time("Uploading localtrust")
		const idsToIndex = objectFlip(ids)
		const convertedLocaltrust: LocalTrust<number> = localtrust.map(({ i, j, v }) => {
				return {
						i: +idsToIndex[i], j: +idsToIndex[j], v: +v
				}
		})

		let merge = false;
		for (let i = 0; i < convertedLocaltrust.length; i += CHUNK_SIZE) {
				const chunk = convertedLocaltrust.slice(i, i + CHUNK_SIZE)
				const opts: any = {
						scheme: 'inline',
						size: ids.length,
						entries: chunk,
				}
				console.log(`IDs: ${ids.length}, entries: ${chunk.length}`)

				const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/local-trust/${schema}.${strategyName}?merge=${merge}`
				console.log(`Uploading localtrust for strategy ${schema}.${strategyName} to ${eigentrustAPI}`)
				await axios.put(eigentrustAPI, opts)
				merge = true;
		}
		console.timeEnd("Uploading localtrust")
	}

	async getLocaltrust(strategyName: string, schema: string) {
		const localtrust = await db(`${schema}.localtrust`)
			.where({ strategyName })
			.select('i', 'j', 'v')

		return localtrust
	}
}