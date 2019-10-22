var gulp = require("gulp");
var elm = require("gulp-elm");
var uglify = require("gulp-uglifyjs");
var fs = require("fs");
var Vinyl = require("vinyl");

function multi() {
  return gulp
    .src("elm/*.elm")
    .pipe(elm.make({ filetype: "html" }))
    .pipe(gulp.dest("dest/"));
}

function nested() {
  return gulp
    .src("elm/nested-elm/*.elm")
    .pipe(elm.make({ filetype: "html", cwd: "elm/nested-elm/" }))
    .pipe(gulp.dest("dest/"));
}

function debug() {
  return gulp
    .src("elm/*.elm")
    .pipe(elm.make({ filetype: "html", debug: true }))
    .pipe(gulp.dest("dest/"));
}

function pipe() {
  // Uglify parameters based on  https://elm-lang.org/0.19.1/optimize
  return gulp
    .src("elm/test1.elm")
    .pipe(elm({ optimize: true }))
    .pipe(
      uglify({
        compress: {
          pure_funcs: [
            "F2",
            "F3",
            "F4",
            "F5",
            "F6",
            "F7",
            "F8",
            "F9",
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9"
          ],
          pure_getters: true,
          keep_fargs: false,
          unsafe_comps: true,
          unsafe: true
        },
        mangle: false
      })
    )
    .pipe(
      uglify({
        compress: false,
        mangle: true
      })
    )
    .pipe(gulp.dest("dest/"));
}

function string_src(filename, string) {
  var src = require("stream").Readable({ objectMode: true });
  src._read = function() {
    this.push(new Vinyl({ path: filename, contents: Buffer.from(string) }));
    this.push(null);
  };
  return src;
}

function string() {
  return string_src("test3.elm", fs.readFileSync("elm/test1.elm"))
    .pipe(elm())
    .pipe(gulp.dest("dest/"));
}

module.exports = {
  default: gulp.parallel(multi, pipe, string),
  pipe,
  multi,
  string,
  debug,
  nested
};
