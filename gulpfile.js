const gulp = require("gulp");
const merge = require("merge2");
const ts = require("gulp-typescript");
const tslint = require("gulp-tslint");
const mocha = require("gulp-mocha");
const npmFiles = require("gulp-npm-files");
const clean = require("gulp-clean");
const replace = require("gulp-replace");

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
        .js.pipe(gulp.dest("dist"));
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
    return gulp.src(["test/generated-files/unit/*.js"], {read:false})
        .pipe(mocha())
        .on("error", () => process.exit(1));
});

gulp.task("clean-dist", () => {
    return gulp.src("dist", {read: false})
        .pipe(clean());
});

gulp.task("copy-package-json", ["clean-dist"], () => {
    gulp.src(["package.json"])
        .pipe(replace("dist/", ""))
        .pipe(gulp.dest("dist"));
});

gulp.task("copy-npm-dependencies", ["clean-dist"], () => {
    return gulp.src(npmFiles(), {base: "./"})
        .pipe(gulp.dest("dist"))
});

gulp.task("copy", ["clean-dist"], () => {
    return gulp.src([
            "src/**/*.html",
            "src/**/*.css",
            "src/pdfjs/**"
        ], {
            base: "src"
        })
        .pipe(gulp.dest("dist"));
});

gulp.task("dist", ["unit-tests", "copy-package-json", "copy-npm-dependencies", "copy"], () => {
    const tsProject = ts.createProject(
        "tsconfig.json",
        {
            removeComments: true
        });
    
    return tsProject
        .src()
        .pipe(ts(tsProject))
        .js.pipe(gulp.dest("dist"));
});

gulp.task("default", ["tsc", "tsc-test", "unit-tests", "dist"]);