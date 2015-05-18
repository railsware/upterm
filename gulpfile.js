const gulp   = require('gulp');
const sass   = require('gulp-sass');
const react  = require('gulp-react');
const concat = require('gulp-concat');
const ts     = require('gulp-typescript');
const babel  = require('gulp-babel');

var watching = false;

function onError(err) {
    console.log(err.toString());
    if (watching) {
        this.emit('end');
    } else {
        process.exit(1);
    }
}

var options = {
    react: {
        source: 'views/*.js',
        target: 'compiled/views',
        config: { stage: 0 }
    },
    typeScript: {
        source: 'src/**/*.ts',
        target: 'compiled',
        config: ts.createProject({
            typescript: require('typescript'),
            target: 'ES5',
            module: 'commonjs',
            noImplicitAny: true,
            removeComments: true,
            preserveConstEnums: true,
            sourceMap: true,
            outDir: 'compiled'
        })
    },
    sass: {
        source: ['stylesheets/*.scss', 'decorators/*.scss'],
        target: {
            directory: 'compiled',
            fileName: 'all.css'
        },
        config: {
            errLogToConsole: true
        }
    }
};

gulp.task('typescript', function () {
    return gulp.src(options.typeScript.source)
               .pipe(ts(options.typeScript.config).on("error", onError))
               .pipe(gulp.dest(options.typeScript.target));
});

gulp.task('sass', function () {
    return gulp.src(options.sass.source)
               .pipe(sass(options.sass.config).on("error", onError))
               .pipe(concat(options.sass.target.fileName))
               .pipe(gulp.dest(options.sass.target.directory));
});

gulp.task('react', function () {
    return gulp.src(options.react.source)
               .pipe(babel(options.react.config).on("error", onError))
               .pipe(react().on("error", onError))
               .pipe(gulp.dest(options.react.target));
});

gulp.task('watch', ['default'], function () {
    watching = true;
    gulp.watch(options.sass.source, ['sass']);
    gulp.watch(options.react.source, ['react']);
    gulp.watch(options.typeScript.source, ['typescript']);
});

gulp.task('default', ['typescript', 'sass', 'react']);
