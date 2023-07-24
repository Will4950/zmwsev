import {getLocals} from './lowdb.js';
import express from 'express';
export const router = express.Router();

async function setLocals(req, res, next) {
	res.locals = getLocals();
	next();
}

router.use('/', express.static('dist'));
router.use('/', express.static('client/assets'));
router.get('/', setLocals, function index(req, res) {
	res.render('index');
});
