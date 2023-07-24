import {Low} from 'lowdb';
import {Memory} from 'lowdb';

const adapter = new Memory();

const db = new Low(adapter, {events: [], locals: {}});

await db.read();

export const {events} = db.data;
export const {locals} = db.data;

export async function writeEvent(event) {
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
