"use strict";

//TODO: Use gulp 4.
const gulp = require("gulp");
const gulpLoadPlugins = require("gulp-load-plugins");
const runSequence = require("run-sequence");

let $ = gulpLoadPlugins();

let watching = false;

gulp.on("stop", function () {
    if (!watching) {
        process.nextTick(function () {
            process.exit(0)
        });
    }
});

const onError = $.notify.onError("An error occurred");

function notify(message) {
    return $.notify({title: "Black Screen Watcher", message: message, onLast: true});
}

const options = {
    typeScript: {
        source: "src/**/*.ts*",
        target: "compiled/src"
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

gulp.task("typescript", $.shell.task("npm run tsc"));

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

gulp.task("default", function () {
    return runSequence(
        "watch",
        $.shell.task("npm run electron")
    );
});
