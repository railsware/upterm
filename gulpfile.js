//TODO: Use gulp 4.
var gulp        = require('gulp');
var $           = require('gulp-load-plugins')();
var runSequence = require('run-sequence').use(gulp);
var path        = require('path');

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
        source: 'static/views/*.js',
        target: 'dist/scripts/views',
        config: { stage: 0 }
    },
    typeScript: {
        source: 'src/**/*',
        target: 'dist/scripts',
        config: $.typescript.createProject({
            typescript: require('typescript'),
            target: 'ES5',
            module: 'commonjs',
            //noImplicitAny: true, TODO: enable.
            removeComments: true,
            preserveConstEnums: true,
            experimentalDecorators: true,
            sourceMap: true,
            jsx: 'react'
        })
    },
    test: {
        source: 'test/**/*.ts',
        target: 'dist/test'
    },
    sass: {
        source: ['static/*.scss'],
        target: {
            directory: 'dist',
            fileName: 'main.css'
        },
        config: {
            errLogToConsole: true
        }
    }
};

gulp.task('copy-static-js', function() {
    return gulp.src('static/**/*.js')
                .pipe(gulp.dest( path.join('dist/scripts') ));
});

gulp.task('copy-static-html', function() {
    return gulp.src('static/*.html')
               .pipe(gulp.dest( path.join('dist') ));
});

gulp.task('typescript', function () {
    return gulp.src(options.typeScript.source)
               .pipe($.typescript(options.typeScript.config).on("error", onError))
               .pipe(gulp.dest(options.typeScript.target))
               .pipe($.livereload())
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
        ['copy-static-js', 'copy-static-html'],
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