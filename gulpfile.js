//TODO: Use gulp 4.
const gulp        = require('gulp');
const $           = require('gulp-load-plugins')();
const runSequence = require('run-sequence').use(gulp);

var watching = false;

gulp.on('stop', function () {
    if (!watching) {
        process.nextTick(function () {
            process.exit(0);
        });
    }
});

function onError(err) {
    var self = this;
    return $.notify.onError(function () {
        $.util.beep();
        $.util.log(err.toString());
        if (err.stack) {
            $.util.log('Stack trace', err.stack.toString());
        }
        self.emit('end');
        return 'Error: <%= error.message %>';
    })(err);
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
        config: $.typescript.createProject({
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
               .pipe($.cached('ts'))
               .pipe($.typescript(options.typeScript.config).on("error", onError))
               .pipe(gulp.dest(options.typeScript.target));
});

gulp.task('sass', function () {
    return gulp.src(options.sass.source)
               .pipe($.cached('sass'))
               .pipe($.sass(options.sass.config).on("error", onError))
               .pipe($.concat(options.sass.target.fileName))
               .pipe(gulp.dest(options.sass.target.directory));
});

gulp.task('react', function () {
    return gulp.src(options.react.source)
               .pipe($.cached('react'))
               .pipe($.babel(options.react.config).on("error", onError))
               .pipe($.react().on("error", onError))
               .pipe(gulp.dest(options.react.target));

});


gulp.task('clean', function (cb) {
    require('del')([options.typeScript.target + '/**', 'node_modules/build/**'], cb);
});

gulp.task('watch', function (cb) {
    watching = true;
    runSequence(
        'clean',
        ['typescript', 'sass', 'react'],
        function() {
            gulp.watch(options.sass.source, ['sass']);
            gulp.watch(options.react.source, ['react']);
            gulp.watch(options.typeScript.source, ['typescript']);
            cb();
        }
    );
});

gulp.task('default', function () {
    runSequence(
        'watch',
        $.shell.task('PATH=node_modules/.bin:$PATH electron .')
    );
});
