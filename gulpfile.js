'use strict';

var gulp = require('gulp'),
	minifycss = require('gulp-clean-css'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	header = require('gulp-header'),
	buffer = require('vinyl-buffer'),
	pkg = require('./package.json'),
	debug = require('gulp-debug'),
	eslint = require('gulp-eslint'),
	prettify = require('gulp-jsbeautifier'),
	browserify = require('browserify'),
	source = require('vinyl-source-stream'),
	rename = require('gulp-rename');

var banner = ['/**',
	' * <%= pkg.name %> v<%= pkg.version %>',
	' * Copyright <%= pkg.company %>',
	' * @link <%= pkg.homepage %>',
	' * @license <%= pkg.license %>',
	' */',
	''].join('\n');

gulp.task('prettify-js', async function () {
	return await gulp.src('./src/js/md-editor.js')
		.pipe(prettify({ js: { brace_style: 'collapse', indent_char: '\t', indent_size: 1, max_preserve_newlines: 3, space_before_conditional: false } }))
		.pipe(gulp.dest('./src/js'));
});

gulp.task('prettify-css', async function () {
	return await gulp.src('./src/css/md-editor.css')
		.pipe(prettify({ css: { indentChar: '\t', indentSize: 1 } }))
		.pipe(gulp.dest('./src/css'));
});

gulp.task('lint', gulp.series('prettify-js', async function () {
	await gulp.src('./src/js/**/*.js')
		.pipe(debug())
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());

}));

function taskBrowserify(opts) {
	return browserify('./src/js/md-editor.js', opts)
		.bundle();
}

gulp.task('browserify:debug', gulp.series('lint', async function () {
	return await taskBrowserify({ debug: true, standalone: 'md-editor', allowEmpty: true })
		.pipe(source('md-editor.debug.js'), { allowEmpty: true })
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest('./debug/'));
}));

gulp.task('browserify', gulp.series('lint', async function () {
	return await taskBrowserify({ standalone: 'md-editor' })
		.pipe(source('md-editor.js'), { allowEmpty: true })
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest('./debug/'));
}));
gulp.task('scripts', gulp.series('browserify:debug', 'browserify', 'lint', async function () {
	var js_files = ['./debug/md-editor.js'];

	return await gulp.src(js_files, { allowEmpty: true })
		.pipe(concat('md-editor.min.js'))
		.pipe(uglify())
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest('./dist/'));
}));

gulp.task('scripts', gulp.series('browserify:debug', 'browserify', 'lint', async function () {
	var js_files = ['./debug/md-editor.js'];
	
	return await gulp.src(js_files, { allowEmpty: true })
		.pipe(concat('md-editor.min.js'))
		.pipe(uglify())
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest('./dist/'));
}));
gulp.task('styles', gulp.series('prettify-css', async function () {
	var css_files = [
		'./node_modules/codemirror/lib/codemirror.css',
		'./src/css/*.css',
		'./node_modules/codemirror-spell-checker/src/css/spell-checker.css'
	];

	return await gulp.src(css_files)
		.pipe(concat('md-editor.css'))
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest('./debug/'))
		.pipe(minifycss())
		.pipe(rename('md-editor.min.css'))
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest('./dist/'));
}));

gulp.task('default', gulp.series('scripts', 'styles'));
