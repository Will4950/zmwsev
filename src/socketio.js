import {config} from './config.js';
import {logger} from './logger.js';
import {clearEvents, events, getLocal, setLocal} from './lowdb.js';
import {reconnect} from './ZMWebSocket.js';
import {Server} from 'socket.io';

export const io = new Server({
	serveClient: false,
	pingInterval: 3500
});

function socketsHandler(socket) {
	socket.on('event', async function socketEventHandler(data, res) {
		if (config.debug) logger.debug(`event | ${data}`);

		if (data === 'eventsClear') {
			await clearEvents();
			res();
		}

		if (data === 'getEvents') {
			for (let i in events) {
				socket.emit('event', events[i]);
			}
		}

		if (data === 'getStatus') {
			socket.emit('status', getLocal('status'));
		}

		if (data === 'closeConfiguration') {
			await reconnect();
		}
	});

	socket.on('save', async (data) => {
		await setLocal(data.id, data.value);
	});
}

io.on('connection', socketsHandler);
