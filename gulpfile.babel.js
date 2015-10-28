//TODO: Use gulp 4.
import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import runSequence from "run-sequence";

const $ = gulpLoadPlugins();

let watching = false;

gulp.on("stop", () => {
    if (!watching) {
        process.nextTick(() => process.exit(0));
    }
});

function onError(err) {
    return $.notify.onError(() => {
        $.util.beep();
        $.util.log(err.toString());
        if (err.stack) {
            $.util.log("Stack trace", err.stack.toString());
        }
        this.emit("end");
        return "Error: <%= error.message %>";
    })(err);
}

function notify(message) {
    return $.notify({title: "Black Screen Watcher", message, onLast: true});
}

const options = {
    typeScript: {
        source: "src/**/*",
        target: "compiled/src",
        babelConfig: { whitelist: ['strict', 'es6.modules', 'es6.spread', 'es6.parameters', 'es6.destructuring']},
        config: $.typescript.createProject({
            typescript: require("typescript"),
            target: "ES6",
            module: "commonjs",
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

gulp.task("typescript", () =>
        gulp.src(options.typeScript.source)
            .pipe($.typescript(options.typeScript.config).on("error", onError))
            .pipe($.babel(options.typeScript.babelConfig).on("error", onError))
            .pipe(gulp.dest(options.typeScript.target))
            .pipe(notify("TypeScript has been compiled."))
);

gulp.task("sass", () =>
        gulp.src(options.sass.source)
            .pipe($.cached("sass"))
            .pipe($.sass(options.sass.config).on("error", onError))
            .pipe($.concat(options.sass.target.fileName))
            .pipe(gulp.dest(options.sass.target.directory))
            .pipe(notify("SCSS has been compiled."))
);

gulp.task("copy-html", () =>
    gulp.src('./src/views/index.html').pipe(gulp.dest('./compiled/src/views'))
);

gulp.task("clean", () => {
    require("del").sync([options.typeScript.target + "/**"]);
});

gulp.task("build", ["typescript", "sass", "copy-html"]);

gulp.task("watch", cb => {
    watching = true;
    runSequence(
        "clean",
        "build",
        () => {
            gulp.watch(options.sass.source, ["sass"]);
            gulp.watch(options.typeScript.source, ["typescript"]);
            cb();
        }
    );
});

gulp.task("compile-tests", () =>
        gulp.src(options.test.source)
            .pipe($.typescript(options.typeScript.config))
            .pipe(gulp.dest(options.test.target))
);

gulp.task("default", () => {
    runSequence(
        "watch",
        $.shell.task("PATH=node_modules/.bin:$PATH electron .")
    );
});
