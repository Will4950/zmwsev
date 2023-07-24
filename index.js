import 'dotenv/config';
import {config} from './src/config.js';
import {app} from './src/express.js';
import {logger} from './src/logger.js';
import {setLocal} from './src/lowdb.js';
import {io} from './src/socketio.js';
import {connect} from './src/ZMWebSocket.js';
import {createServer} from 'node:http';

function onHup(signal) {
	logger.info(`EVENT RECEIVED: ${signal}`);
}

function onInt() {
	process.exit();
}

process.on('SIGHUP', onHup);
process.on('SIGINT', onInt);

async function onListening() {
	logger.info(`http | listening on ${config.host}:${config.port}`);
	try {
		for (const [key, value] of Object.entries(config)) {
			await setLocal(key, value);
		}
		if (config.debug) await setLocal('debug', false);
		logger.info('configuration loaded from env');

		await io.attach(server);
		logger.info('socket.io server | started');

		await connect();
		logger.info('websocket client | started');
	} catch (e) {
		logger.error(e.message);
	}
}

async function onError(error) {
	logger.error(`http | ${error}`);
	process.exit(1);
}

const server = createServer(app);
server.on('error', onError);
server.on('listening', onListening);

server.listen(config.port, config.host);
