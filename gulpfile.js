const clean = require("gulp-clean");
const gulp = require("gulp");
const istanbul = require("gulp-istanbul");
const merge = require("merge2");
const mocha = require("gulp-mocha");
const npmFiles = require("gulp-npm-files");
const os = require("os");
const package = require("./package.json");
const packager = require("electron-packager");
const replace = require("gulp-replace");
const ts = require("gulp-typescript");
const tslint = require("gulp-tslint");

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

gulp.task("tsc", ["tslint", "clean-dist"], () => {
    const tsProject = ts.createProject("tsconfig.json");

    return tsProject
        .src()
        .pipe(ts(tsProject))
        .js.pipe(gulp.dest("dist"));
});

gulp.task("tsc-test", ["tslint", "clean-test"], () => {
    return gulp.src([
            "test/**/*.ts",
            "!**/*.d.ts",
            "!**/node_modules"
        ])
        .pipe(ts({
            noImplicitAny: true,
            "target": "es2015",
            "module": "commonjs"
        }))
        .pipe(replace("../../src/", "../../../dist/"))
        .pipe(gulp.dest("test/generated-files"));
});

gulp.task("unit-test-cover", ["tsc", "tsc-test"], () => {
    return gulp.src(["dist/**/*.js"])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

gulp.task("unit-tests", ["unit-test-cover"], () => {
    return gulp.src([
            "test/generated-files/unit/**/*.js",
            "!**/_*.js"
        ], {
            read: false
        })
        .pipe(mocha())
        .on("error", (err) => {
            console.log("Unit tests failed:");
            console.log(err);
            process.exit(1);
        })
        .pipe(istanbul.writeReports())
        .pipe(istanbul.enforceThresholds({
            thresholds: {
                global: 80
            }
        }));
});

gulp.task("clean-dist", () => {
    return gulp.src("dist", {read: false})
        .pipe(clean());
});

gulp.task("clean-test", () => {
    return gulp.src("test/generated-files", {read: false})
        .pipe(clean());
});

gulp.task("copy-package-json", ["clean-dist"], () => {
    gulp.src(["package.json"])
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

gulp.task("dist", [
        "unit-tests",
        "tsc",
        "copy-package-json",
        "copy-npm-dependencies",
        "copy"
    ], () => {
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

gulp.task("package", ["dist"], (done) => {
    var options = {
        dir: "dist",
        name: package.productName,
        platform: "darwin",
        arch: "x64",
        version: process.versions.electron,
        out: "packages",
        "app-version": package.version,
        overwrite: true
    };
    packager(options, (err, appPath) => {
        if (err) {
            return console.log(err);
        }
        done();
    });
});

gulp.task("integration-tests", ["tsc-test", "package"], () => {
    gulp.src([
            "test/generated-files/integration/**/*.js",
            "!**/_*.js"
        ], {
            read:false
        })
        .pipe(mocha())
        .on("error", (err) => {
            console.log("Integration tests failed:");
            console.log(err);
            process.exit(1);
        });
});

gulp.task("default", ["dist"]);