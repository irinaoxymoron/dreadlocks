'use strict';

var gulp = require('gulp'),
    pug = require('gulp-pug'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    newer = require('gulp-newer'),
    cleanCSS = require('gulp-clean-css'), // clean CSS
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    watch = require('gulp-watch'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    browserify = require('gulp-browserify'),
    babel = require('gulp-babel'),
    fileinclude = require('gulp-file-include'),
    browserSync = require('browser-sync').create(),
    spritesmith = require('gulp.spritesmith'),
    imagemin = require('gulp-imagemin'),
    argv = require('yargs').argv,
    prod = argv.prod; // min

var app_dir = 'app';
var wp_dir = 'dist';

gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: wp_dir
        }
    });
});

gulp.task('sass', function () {
    return gulp.src(app_dir + '/scss/**/*.scss')
        .pipe(gulpif(!Boolean(prod), sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer({browsers: ['last 5 versions']})]))
        .pipe(cleanCSS())
        .pipe(gulpif(!Boolean(prod), sourcemaps.write()))
        .pipe(gulp.dest(wp_dir + '/css'));
});

gulp.task('moveJs', function () {
    return gulp.src(app_dir + '/js/*.js')
        .pipe(gulpif(Boolean(prod), babel({
            presets: ['es2015']
        })))
        .pipe(gulpif(Boolean(prod), uglify()))
        .pipe(gulp.dest(wp_dir + '/js'));
});

gulp.task('moveHtml', function () {
    return gulp.src(app_dir + '/*.html')
        .pipe(fileinclude())
        .pipe(gulp.dest(wp_dir));
});

gulp.task('pug', function() {
    return gulp.src(app_dir + '/**/*.pug')
        .pipe(plumber({ errorHandler: onError }))
        .pipe(pug())
        .pipe(gulp.dest(wp_dir));
});

/* Sprite */
gulp.task('sprite', function(cb) {
    const spriteData = gulp.src('app/img/icons/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        imgPath: '../../img/sprite.png',
        cssName: '_sprite.scss'
    }));

    spriteData.img.pipe(gulp.dest('app/img/'));
    spriteData.css.pipe(gulp.dest('app/scss/modules/'));
    cb();
});

/* Optimizing images (by hand) */
gulp.task('img:opt', function () {
    return gulp.src([
            app_dir + '/img/*.{gif,png,jpg,jpeg,svg}',
            '!' + app_dir + '/img/sprite-svg.svg',
        ])
        .pipe(plumber({ errorHandler: onError }))
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 7}),
            imagemin.svgo({plugins: [{removeViewBox: false}]})
        ]))
        .pipe(gulp.dest(app_dir + '/img'));
});

gulp.task('moveImg', function () {
    return gulp.src(app_dir + '/img/**.*')
        .pipe(gulp.dest(wp_dir + '/img'));
});

gulp.task('moveFonts', function () {
    return gulp.src(app_dir + '/fonts/**.*')
        .pipe(gulp.dest(wp_dir + '/fonts'));
});

gulp.task('watch', function () {
    gulp.watch(app_dir + '/scss/**/*.scss', gulp.series('sass'));
    gulp.watch(app_dir + '/js/*.js', gulp.series('moveJs'));
    gulp.watch(app_dir + '/**/*.html', gulp.series('moveHtml'));
    gulp.watch(app_dir + '/img/*.*', gulp.series('moveImg'));
});

gulp.task('rebase', gulp.series(
    'moveHtml',
    'moveImg',
    'moveJs',
    'sass',
    'moveFonts'
));

gulp.task('default', gulp.series('rebase', gulp.parallel('browser-sync', 'watch')));