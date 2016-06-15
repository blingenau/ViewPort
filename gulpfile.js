const gulp = require("gulp");
const merge = require("merge2");
const ts = require("gulp-typescript");
const tslint = require("gulp-tslint");

gulp.task("tslint", () => {
    return gulp
        .src(["src/**/*.ts", "!src/**/*.d.ts"])
        .pipe(tslint())
        .pipe(tslint.report("verbose"));
});

gulp.task("tsc", () => {
    const tsProject = ts.createProject("tsconfig.json");

    return tsProject
        .src()
        .pipe(ts(tsProject))
        .js.pipe(gulp.dest("src"));
});

gulp.task("copy", () => {
    return gulp
        .src(["src/*.html", "src/*.css"])
        .pipe(gulp.dest("dist"));
});

gulp.task("dist", () => {
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

gulp.task("default", ["tsc", "tslint", "dist", "copy"]);