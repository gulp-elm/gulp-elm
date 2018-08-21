var gulp   = require('gulp');
var elm    = require('gulp-elm');
var uglify = require('gulp-uglifyjs');
var fs     = require('fs');
var Vinyl  = require('vinyl');

// elm-make --yes
var init = elm.init;
function initNested(){
  return elm.init({cwd: 'elm/nested-elm/'});
}

function multi(){
  return gulp.src('elm/*.elm')
    .pipe(elm.make({filetype: 'html'}))
    .pipe(gulp.dest('dest/'));
}

function nested(){
  return gulp.src('elm/nested-elm/*.elm')
    .pipe(elm.make({filetype: 'html', cwd: 'elm/nested-elm/'}))
    .pipe(gulp.dest('dest/'));
}

function debug(){
  return gulp.src('elm/*.elm')
    .pipe(elm.make({filetype: 'html', debug: true }))
    .pipe(gulp.dest('dest/'));
}

function pipe(){
  return gulp.src('elm/test1.elm')
    .pipe(elm())
    .pipe(uglify())
    .pipe(gulp.dest('dest/'));
}

function string_src(filename, string) {
  var src = require('stream').Readable({ objectMode: true })
  src._read = function () {
    this.push(new Vinyl({ path: filename, contents: Buffer.from(string) }))
    this.push(null)
  }
  return src
}

function string() {
  return string_src('test3.elm', fs.readFileSync('elm/test1.elm'))
    .pipe(elm())
    .pipe(gulp.dest('dest/'))
}

module.exports = {
  default: gulp.series(init, gulp.parallel(multi, pipe, string)),
  pipe: gulp.series(init, pipe),
  multi: gulp.series(init, multi),
  string: gulp.series(init, string),
  debug: gulp.series(init, debug),
  nested: gulp.series(initNested, nested),
};
