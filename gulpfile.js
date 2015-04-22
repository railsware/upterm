var gulp = require('gulp');
var sass = require('gulp-sass');
var react = require('gulp-react');
var ts = require('gulp-typescript');

var options = {
    target: 'compiled',
    source: {
        typeScript: 'src/*.ts',
        sass: 'stylesheets/*.sass',
        react: 'react.js'
    },
    config: {
        sass: {
            indentedSyntax: true,
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
            "out": "terminal.js",
        })
    }
};

gulp.task('compile-typescript', function () {
    return gulp.src(options.source.typeScript).pipe(ts(options.config.typeScript)).pipe(gulp.dest(options.target));
});

gulp.task('compile-sass', function () {
    return gulp.src(options.source.sass).pipe(sass(options.config.sass)).pipe(gulp.dest(options.target));
});

gulp.task('compile-react', function () {
    return gulp.src(options.source.react).pipe(react()).pipe(gulp.dest(options.target));
});

gulp.task('default', function () {
    gulp.start('compile-typescript', 'compile-sass', 'compile-react');
});
