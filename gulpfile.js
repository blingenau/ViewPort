const gulp = require("gulp");
const merge = require("merge2");
const ts = require("gulp-typescript");
const tslint = require("gulp-tslint");
const mocha = require("gulp-mocha");

gulp.task("tslint", () => {
    return gulp
        .src([
            "src/**/*.ts",
            "test/**/*.ts",
            "!**/*.d.ts",
            "!**/node_modules"
        ])
        .pipe(tslint({
            configuration: "./tslint.json"
        }))
        .pipe(tslint.report("verbose"));
});

gulp.task("tsc", ["tslint"], () => {
    const tsProject = ts.createProject("tsconfig.json");

    return tsProject
        .src()
        .pipe(ts(tsProject))
        .js.pipe(gulp.dest("src"));
});

gulp.task("tsc-test", ["tslint"], () => {
    return gulp.src([
            "test/**/*.ts",
            "!**/*.d.ts",
            "!**/node_modules"
        ])
        .pipe(ts({
            noImplicitAny: true,
            target: "es5"
        }))
        .pipe(gulp.dest("test/generated-files"));
});

gulp.task("unit-tests", ["tsc-test"], () => {
    gulp.src(["test/generated-files/unit/*.js"], {read:false})
        .pipe(mocha())
        .on("error", () => process.exit(1));
});

gulp.task("copy", () => {
    return gulp
        .src(["src/*.html", "src/*.css"])
        .pipe(gulp.dest("dist"));
});

gulp.task("dist", ["unit-tests"], () => {
    const tsProject = ts.createProject(
        "tsconfig.json",
        {
            removeComments: true
        });
    
    return tsProject
        .src()
        .pipe(ts(tsProject))
        .js.pipe(gulp.dest("dist"));
    /*
    return merge([
        tsResult.dts.pipe(gulp.dest("dist")),
        tsResult.js.pipe(gulp.dest("dist"))
    ]);
    */
});

gulp.task("default", ["tslint", "tsc", "tsc-test", "unit-tests", "dist", "copy"]);