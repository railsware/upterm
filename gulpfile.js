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

function notify(message) {
    return $.notify({title: "Black Screen Watcher", message: message, onLast: true});
}

var options = {
    react: {
        source: 'views/*.js',
        target: 'compiled/views',
        config: { stage: 0 }
    },
    typeScript: {
        source: 'src/**/*.ts',
        target: 'compiled/src',
        config: $.typescript.createProject({
            typescript: require('typescript'),
            target: 'ES5',
            module: 'commonjs',
            noImplicitAny: true,
            removeComments: true,
            preserveConstEnums: true,
            sourceMap: true
        })
    },
    test: {
        source: 'test/**/*.ts',
        target: 'compiled/test'
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
               .pipe($.typescript(options.typeScript.config).on("error", onError))
               .pipe(gulp.dest(options.typeScript.target))
               .pipe(notify("TypeScript has been compiled."));
});

gulp.task('sass', function () {
    return gulp.src(options.sass.source)
               .pipe($.cached('sass'))
               .pipe($.sass(options.sass.config).on("error", onError))
               .pipe($.concat(options.sass.target.fileName))
               .pipe(gulp.dest(options.sass.target.directory))
               .pipe($.livereload())
               .pipe(notify("SCSS has been compiled."));
});

gulp.task('react', function () {
    return gulp.src(options.react.source)
               .pipe($.cached('react'))
               .pipe($.babel(options.react.config).on("error", onError))
               .pipe($.react().on("error", onError))
               .pipe(gulp.dest(options.react.target))
               .pipe(notify("React has been compiled."));
});


gulp.task('clean', function (cb) {
    require('del')([options.typeScript.target + '/**'], cb);
});

gulp.task('watch', function (cb) {
    watching = true;
    $.livereload.listen();
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

gulp.task('compile-tests', function () {
    return gulp.src(options.test.source)
        .pipe($.typescript(options.typeScript.config))
        .pipe(gulp.dest(options.test.target));
});

gulp.task('default', function () {
    runSequence(
        'watch',
        $.shell.task('PATH=node_modules/.bin:$PATH electron .')
    );
});
