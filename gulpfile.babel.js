//TODO: Use gulp 4.
import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import runSequence from "run-sequence";

var $ = gulpLoadPlugins();

var watching = false;

gulp.on("stop", function () {
    if (!watching) {
        process.nextTick(function () {
            process.exit(0)
        });
    }
});

var onError = $.notify.onError("An error occurred");

function notify(message) {
    return $.notify({title: "Black Screen Watcher", message: message, onLast: true});
}

var options = {
    typeScript: {
        source: "src/**/*",
        target: "compiled/src",
        config: $.typescript.createProject({
            typescript: require("typescript"),
            target: "ES6",
            noImplicitAny: true,
            removeComments: true,
            preserveConstEnums: true,
            experimentalDecorators: true,
            experimentalAsyncFunctions: true,
            jsx: "react"
        })
    },
    test: {
        source: "test/**/*.ts",
        target: "compiled/test"
    },
    sass: {
        source: ["stylesheets/*.scss", "decorators/*.scss"],
        target: {
            directory: "compiled",
            fileName: "all.css"
        },
        config: {
            errLogToConsole: true
        }
    }
};

gulp.task("typescript", function () {
        return gulp.src(options.typeScript.source)
            .pipe($.typescript(options.typeScript.config).on("error", onError))
            .pipe($.babel().on("error", onError))
            .pipe(gulp.dest(options.typeScript.target))
            .pipe(notify("TypeScript has been compiled."))
    }
);

gulp.task("sass", function () {
        return gulp.src(options.sass.source)
            .pipe($.cached("sass"))
            .pipe($.sass(options.sass.config).on("error", onError))
            .pipe($.concat(options.sass.target.fileName))
            .pipe(gulp.dest(options.sass.target.directory))
            .pipe(notify("SCSS has been compiled."))
    }
);

gulp.task("copy-html", function () {
        return gulp.src('./src/views/index.html').pipe(gulp.dest('./compiled/src/views'))
    }
);

gulp.task("clean", function () {
    return require("del").sync([options.typeScript.target + "/**"]);
});

gulp.task("build", ["typescript", "sass", "copy-html"]);

gulp.task("watch", function (cb) {
    watching = true;
    runSequence(
        "clean",
        "build",
        function () {
            gulp.watch(options.sass.source, ["sass"]);
            gulp.watch(options.typeScript.source, ["typescript"]);
            cb();
        }
    );
});

gulp.task("compile-tests", function () {
        return gulp.src(options.test.source)
            .pipe($.typescript(options.typeScript.config))
            .pipe(gulp.dest(options.test.target))
    }
);

gulp.task("default", function () {
    return runSequence(
        "watch",
        $.shell.task("PATH=node_modules/.bin:$PATH electron .")
    );
});
