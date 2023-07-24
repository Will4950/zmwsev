import {logger} from './logger.js';
import {router} from './router.js';
import express from 'express';
import expressWinston from 'express-winston';
import favicon from 'serve-favicon';

export const app = express();

app.set('trust proxy', 1);
app.set('strict routing', true);
app.set('query parser', 'simple');
app.set('x-powered-by', false);
app.set('view engine', 'pug');
app.set('views', './client/views');

app.use(expressWinston.logger({winstonInstance: logger, level: 'http'}));
app.use(favicon('client/assets/favicon.ico'));
app.use(router);

app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		return res.status(400).send({status: 400, message: err.message});
	}
	next();
});

app.use((req, res) => {
	res.sendStatus(404);
});
