import {deleteSync, deleteAsync} from 'del';
import gulp from 'gulp';
import cache from 'gulp-cache';
import concat from 'gulp-concat';
import eslint from 'gulp-eslint-new';
import nodemon from 'gulp-nodemon';
import cleanCSS from 'gulp-clean-css';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import uglify from 'gulp-uglify';
import streamqueue from 'streamqueue';

const sass = gulpSass(dartSass);

const outputRoot = 'dist';
const outputPaths = {
	css: `${outputRoot}/css`,
	fonts: `${outputRoot}/css/files`,
	js: `${outputRoot}/js`
};

const clientRoot = 'client';
const inputGlobs = {
	client: [`${clientRoot}/src/**/*.js`],
	scss: ['client/sass/*.scss'],
	fonts: [
		'node_modules/bootstrap-icons/font/fonts/*.woff2',
		'node_modules/@fontsource/ubuntu/files/ubuntu-*-400-*.woff*'
	],
	vendor: [
		'node_modules/socket.io-client/dist/socket.io.min.js',
		'node_modules/jquery/dist/jquery.min.js',
		'node_modules/jquery-backstretch/jquery.backstretch.min.js',
		'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
		'node_modules/bootstrap-table/dist/bootstrap-table.min.js'
	]
};

gulp.task('clean', () => {
	return deleteAsync(`${outputRoot}/*/`);
});

gulp.task('css', () => {
	deleteSync(`${outputPaths.css}/*.css`);
	return gulp
		.src(inputGlobs.scss)
		.pipe(sass({quietDeps: true}))
		.pipe(cache(cleanCSS({level: {1: {specialComments: 0}}})))
		.pipe(gulp.dest(outputPaths.css));
});

gulp.task('fonts', () => {
	deleteSync(`${outputRoot}/css/files/*/`);
	return gulp.src(inputGlobs.fonts).pipe(gulp.dest(outputPaths.fonts));
});

gulp.task('lint', () => {
	return gulp
		.src(['src/**/*.js', 'index.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('js', () => {
	deleteSync(`${outputPaths.js}/**/*`);
	return streamqueue(
		{objectMode: true},
		gulp.src(inputGlobs.vendor).pipe(cache(uglify())),
		gulp
			.src(['client/src/**/*.js'])
			.pipe(eslint())
			.pipe(eslint.format())
			.pipe(cache(uglify()))
	)
		.pipe(concat('client.js'))
		.pipe(gulp.dest(outputPaths.js));
});

gulp.task('watch', (done) => {
	const watch_src = gulp.watch(['src/**/*.js', 'index.js']);
	watch_src.on('change', (path) => {
		return gulp.src(path).pipe(eslint()).pipe(eslint.format());
	});

	gulp.watch(['client/sass/**/*.scss'], gulp.series('css'));
	gulp.watch(['client/**/*.js'], gulp.series('js'));

	nodemon({
		script: './index.js',
		ext: 'js',
		watch: ['src/', 'index.js', '.env', 'package.json'],
		env: {
			NODE_ENV: 'development',
			version: process.env.npm_package_version,
			DEBUG: true
		},
		done: done
	});
});

export default gulp.series('clean', 'lint', 'css', 'fonts', 'js');
