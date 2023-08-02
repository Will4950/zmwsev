import {config} from './config.js';
import {logger} from './logger.js';
import {Low} from 'lowdb';
import {Memory} from 'lowdb';
import {Client} from '@elastic/elasticsearch';

const adapter = new Memory();

const db = new Low(adapter, {events: [], locals: {}});

await db.read();

export const {events} = db.data;
export const {locals} = db.data;

export async function writeEvent(event) {
	if (config.elastic === 'true') {
		if (config.elasticCloud === 'true') {
			try {
				const elasticSearch = new Client({
					cloud: {
						id: config.elasticCloudID
					},
					auth: {
						apiKey: config.elasticApiKey
					}
				});
				await elasticSearch.index({
					index: config.elasticIndex,
					document: {...event}
				});
				await elasticSearch.indices.refresh({index: config.elasticIndex});
				if (config.debug) logger.debug(`sending event to ElasticSearch`);
			} catch (e) {
				logger.warn(`ElasticSearch | ${e.message}`);
			}
		} else {
			try {
				const elasticSearch = new Client({node: config.elasticNode});

				try {
					await elasticSearch.indices.create({index: config.elasticIndex});
				} catch (e) {
					if (config.debug) logger.debug(`create: | ${e.message}`);
				}

				await elasticSearch.indices.refresh({index: config.elasticIndex});
				await elasticSearch.index({
					index: config.elasticIndex,
					document: {...event}
				});
				await elasticSearch.indices.refresh({index: config.elasticIndex});
				if (config.debug) logger.debug(`sending event to ElasticSearch`);
			} catch (e) {
				logger.warn(`ElasticSearch | ${e.message}`);
			}
		}
	}
	db.data.events.push(event);
	db.write();
}

export async function clearEvents() {
	db.data.events.length = 0;
	db.write();
}

export async function setLocal(key, value) {
	db.data.locals[key] = value;
	db.write();
}

export function getLocals() {
	return {...locals};
}

export function getLocal(val) {
	return locals[val];
}
