import {config} from './config.js';
import winston from 'winston';

export const logger = winston.createLogger({});

logger.add(
	new winston.transports.Console({
		level: config.isProd ? 'verbose' : 'silly',
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.timestamp({
				format: 'DD-MM:HH:mm:ss'
			}),
			winston.format.printf(
				(info) => `[${info.timestamp}] [${info.level}] : ${info.message}`
			)
		)
	})
);
