const del = require('del');
const gulp = require('gulp');
const cache = require('gulp-cached');
const orfalius = require('./orfalius');


const TEMPLATE = 'resources/template.html';
const SOURCE = 'src/**/*.md';
const SNIPPETS = 'src/**/*.mds';
const IMAGES = 'src/**/img/**/*';
const STATIC = ['src/**/*', '!' + SOURCE, '!' + SNIPPETS];
const ASSETS = ['resources/**/css/*', 'resources/**/fonts/*', 'resources/**/icons/*', 'resources/**/js/*'];


function clean() {
    return del(['site/*']);
}


function compile() {
    return gulp.src([SOURCE]).
        pipe(cache('compile')).
        pipe(orfalius(TEMPLATE)).
        pipe(gulp.dest('site'));
}

function copyStatic() {
    return gulp.src(STATIC).
        pipe(cache('copy')).
        pipe(gulp.dest('site'));
}

function copyAssets() {
    return gulp.src(ASSETS).
        pipe(cache('copy')).
        pipe(gulp.dest('site'));
}


function watch() {
    gulp.watch([TEMPLATE, SOURCE, SNIPPETS, IMAGES], compile);
    gulp.watch(STATIC, copyStatic);
    gulp.watch(ASSETS, copyAssets);
}


gulp.task('clean', clean);

gulp.task('default', gulp.series(
    gulp.parallel(
        compile,
        copyStatic,
        copyAssets),
    watch,
));
