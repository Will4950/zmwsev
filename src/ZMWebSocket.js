import {config} from './config.js';
import {logger} from './logger.js';
import {getLocal, setLocal} from './lowdb.js';
import {writeEvent} from './lowdb.js';
import {io} from './socketio.js';
import axios from 'axios';
import WebSocket from 'ws';
import {createHmac} from 'node:crypto';

let ws = null;
let heartbeat = null;
let disconnected = null;
let connecting = false;

async function getAccessToken() {
	try {
		let oauthToken = Buffer.from(
			`${getLocal('clientID')}:${getLocal('clientSecret')}`
		).toString('base64');
		let res = await axios({
			method: 'post',
			url: `${getLocal(
				'zoomAuth'
			)}token?grant_type=account_credentials&account_id=${getLocal(
				'accountID'
			)}`,
			headers: {Authorization: `Basic ${oauthToken}`}
		});
		return res.data.access_token;
	} catch (e) {
		return false;
	}
}

export async function reconnect() {
	if (config.debug) logger.debug('Restarting WebSocket');
	if (connecting === true) return;
	await reconnectZMWebSocket();
}

async function reconnectZMWebSocket() {
	io.emit('disconnected');
	clearTimeout(heartbeat);
	try {
		ws.removeAllListeners();
	} catch (e) {
		//no worries
	}
	ws = null;
	connecting = true;
	await new Promise((r) => setTimeout(r, 5000 * Math.random()));
	return await connect();
}

export async function connect() {
	try {
		let access_token = await getAccessToken();
		if (!access_token)
			throw new Error('Unable to get access token. Retrying...');
		ws = new WebSocket(
			`${getLocal('wssEndpoint')}&access_token=${access_token}`
		);
	} catch (e) {
		logger.warn(`${e.message}`);
		const message =
			'Invalid Access Token.  Verify S2S OAuth Account ID, Client ID, and Client Secret are correct.';
		setLocal('status', message);
		io.emit('error', message);
		return reconnectZMWebSocket();
	}

	ws.on('error', (error) => {
		logger.warn(error.message);
		const message =
			'Invalid WSS Endpoint URL.  Verify your WSS Endpoint URL is correct.';
		setLocal('status', message);
		io.emit('error', message);
		return reconnectZMWebSocket();
	});

	ws.on('open', function open() {
		connecting = false;
		function sendHeartbeat() {
			ws.send(getLocal('heartbeat'));
			heartbeat = setTimeout(sendHeartbeat, getLocal('delay') * Math.random());
		}
		sendHeartbeat();
	});

	ws.on('close', function close() {
		logger.warn(`Remote server disconnect.`);
		const message = 'Remote server closed the socket.  Retrying connection...';
		setLocal('status', message);
		io.emit('error', message);
		return reconnect();
	});

	ws.on('message', async function message(message) {
		let data = {};

		try {
			data = JSON.parse(message);
		} catch (e) {
			logger.warn('Invalid JSON received');
			return;
		}

		if (data.module === 'build_connection') {
			if (data.success === false) {
				logger.warn(`${data.content}.  Retrying...`);
				return reconnectZMWebSocket();
			}
		}

		if (data.module === 'heartbeat') {
			clearTimeout(disconnected);
			setLocal('status', false);
			io.emit('heartbeat');
			io.emit('connected');
			if (data.success === false) {
				logger.warn(`${data.content}.`);
			}
		}

		if (config.debug) logger.debug(`data | ${message}`);

		if (data.module === 'message') {
			try {
				let content = `v0:${data.header['x-zm-request-timestamp']}:${data.content}`;
				let hashForVerify = createHmac('sha256', getLocal('secretToken'))
					.update(content)
					.digest('hex');
				let signature = `v0=${hashForVerify}`;
				let test = JSON.parse(`["${data.header['x-zm-signature']}"]`)[0];
				if (signature !== test) throw new Error('Invalid message signature.');
				if (config.debug) logger.debug(`message | ${data.content}`);
			} catch (e) {
				const message =
					'Invalid message signature.  Verify your Secret Token is correct.';
				setLocal('status', message);
				io.emit('error', message);
				logger.warn(e.message);
			}

			try {
				let event = JSON.parse(data.content);
				await writeEvent(event);
				io.emit('event', event);
			} catch (e) {
				logger.warn(e.message);
			}
		}
	});
}
