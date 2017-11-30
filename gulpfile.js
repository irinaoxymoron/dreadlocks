'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    newer = require('gulp-newer'),
    csso = require('gulp-csso'), // минификатор CSS
    cleanCSS = require('gulp-clean-css'),
    postcss = require('gulp-postcss'), // npm install --save-dev gulp-postcss
    autoprefixer = require('autoprefixer'), // npm install autoprefixer --save-dev
    watch = require('gulp-watch'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    browserify = require('gulp-browserify'),
    babel = require('gulp-babel'),
    fileinclude = require('gulp-file-include'),
    browserSync = require('browser-sync').create(),
    argv = require('yargs').argv,
    spritesmith = require('gulp.spritesmith'),
    prod = argv.prod; // минификация


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
        .pipe(gulpif(Boolean(prod), csso()))
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

/*   pipe(pagebuilder(app_dir))         */
gulp.task('moveHtml', function () {
    return gulp.src(app_dir + '/*.html')
        .pipe(fileinclude())
        .pipe(gulp.dest(wp_dir));
});

/*   Sprite   */
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
    // gulp.watch(app_dir + '/**/*').on('change', browserSync.reload);
});

gulp.task('rebase', gulp.series(
    'moveHtml',
    'moveImg',
    'moveJs',
    'sass',
    'moveFonts'
));

gulp.task('default', gulp.series('rebase', gulp.parallel('browser-sync', 'watch')));