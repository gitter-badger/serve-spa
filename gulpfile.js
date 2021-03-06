'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var jshint = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');
var chalk = require('chalk');
var rimraf = require('rimraf');
var coveralls = require('gulp-coveralls');

var chai = require("chai");
global.expect = chai.expect;


var paths = {
    libFiles: './lib/**/*.js',
    gulpfile: './gulpfile.js',
    specFiles: './test/spec/**/*.js',
    fixtureFiles: './test/fixtures/**/*.js'
};


gulp.task('dev', ['watch', 'validate']);

gulp.task('watch', function () {

    gulp.watch([
        paths.libFiles,
        paths.specFiles,
        paths.fixtureFiles
    ], [
        'validate'
    ]);

    gulp.watch([
        paths.gulpfile
    ], [
        'lint'
    ]);

});

gulp.task('validate', function (done) {
    runSequence('lint', 'test', done);
});

gulp.task('lint', function () {

    return gulp.src([paths.libFiles, paths.gulpfile, paths.specFiles, paths.fixtureFiles])
        .pipe(jshint())
        .pipe(jshint.reporter(jshintStylish))
        .pipe(jshint.reporter('fail'));

});

gulp.task('test', ['clean'], function (done) {

    var coverageVariable = '$$cov_' + new Date().getTime() + '$$';

    gulp.src(paths.libFiles)
        .pipe(istanbul({
            coverageVariable: coverageVariable
        }))
        .pipe(istanbul.hookRequire())
        .on('finish', function () {

            gulp.src(paths.specFiles)
                .pipe(mocha())
                .on('error', function (err) {
                    console.error(String(err));
                    console.log(chalk.bold.bgRed(' TESTS FAILED '));
                    done(new Error(' TESTS FAILED '));
                })
                .pipe(istanbul.writeReports({
                    reporters: ['lcov'],
                    coverageVariable: coverageVariable
                }))
                .on('end', done);

        });

});

gulp.task('test-without-coverage', function () {

    return gulp.src(paths.specFiles)
        .pipe(mocha())
        .on('error', function () {
            console.log(chalk.bold.bgRed(' TESTS FAILED '));
        });

});

gulp.task('clean', function (done) {
    rimraf('./coverage', done);
});

gulp.task('ci', function (done) {
    runSequence('validate', 'coveralls', 'test-without-coverage', done);
});

gulp.task('coveralls', function () {
    return gulp.src('coverage/**/lcov.info')
        .pipe(coveralls());
});
