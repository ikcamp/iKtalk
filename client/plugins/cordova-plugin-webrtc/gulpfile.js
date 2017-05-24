'use strict';

var gulp = require('gulp');
var pl = require('gulp-load-plugins')({
    // lazy: false
});
var webpack = require('webpack');

var config = {
    entry: 'index.js',
    dist: 'dist/',
    jsglob: ['app/**/*.js'],
};

var startWebpack = function (watch) {
    return pl.webpack({
        output: {
            filename: 'webrtc.js',
            publicPath: '.',
            library: 'webrtc',
            libraryTarget: 'commonjs2'
        },
        bail: true,
        externals: {
            'cordova/exec': true,
        },
        resolve: {
            modulesDirectories: ['node_modules', 'bower_components'],
        },
        watch: watch,
        keepalive: watch,
        plugins: [
            //makes ProvidePlugin use bower.json
            new webpack.ResolverPlugin(
                new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])),
        ]
    });
};

gulp.task('build', function () {
    gulp.src(config.entry)
        .pipe(startWebpack(false))
        .pipe(gulp.dest(config.dist));
});

gulp.task('watch', function () {
    gulp.src(config.entry)
        .pipe(startWebpack(true))
        .pipe(gulp.dest(config.dist));
});

gulp.task('default', ['build']);
