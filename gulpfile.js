const gulp = require('gulp');
const sass = require('gulp-sass');
const react = require('gulp-react');
const concat = require('gulp-concat');
const ts = require('gulp-typescript');

var options = {
    target: 'compiled',
    source: {
        typeScript: 'src/*.ts',
        sass: ['stylesheets/*.scss', 'decorators/*.scss'],
        react: 'javascript/react.js'
    },
    config: {
        sass: {
            errLogToConsole: true
        },
        typeScript: ts.createProject({
            typescript: require('typescript'),
            "target": "ES5",
            "module": "commonjs",
            "noImplicitAny": true,
            "removeComments": true,
            "preserveConstEnums": true,
            "sourceMap": true,
            "out": "terminal.js"
        })
    }
};

gulp.task('typescript', function () {
    return gulp.src(options.source.typeScript)
               .pipe(ts(options.config.typeScript))
               .pipe(gulp.dest(options.target));
});

gulp.task('sass', function () {
    return gulp.src(options.source.sass)
               .pipe(sass(options.config.sass))
               .pipe(concat('all.css'))
               .pipe(gulp.dest(options.target));
});

gulp.task('react', function () {
    return gulp.src(options.source.react)
               .pipe(react())
               .pipe(gulp.dest(options.target));
});

gulp.task('watch', function () {
    gulp.watch(options.source.sass, ['sass']);
    gulp.watch(options.source.react, ['react']);
});

gulp.task('default', ['typescript', 'sass', 'react']);
