var gulp   = require('gulp');
var elm    = require('gulp-elm');
var uglify = require('gulp-uglifyjs');
var fs     = require('fs');
var Vinyl  = require('vinyl');

// elm-make --yes
gulp.task('init', elm.init);
gulp.task('init-nested', function(){
  return elm.init({cwd: 'elm/nested-elm/'});
});

gulp.task('multi', ['init'], function(){
  return gulp.src('elm/*.elm')
    .pipe(elm.make({filetype: 'html'}))
    .pipe(gulp.dest('dest/'));
});

gulp.task('nested', ['init-nested'], function(){
  return gulp.src('elm/nested-elm/*.elm')
    .pipe(elm.make({filetype: 'html', cwd: 'elm/nested-elm/'}))
    .pipe(gulp.dest('dest/'));
});

gulp.task('debug', ['init'], function(){
  return gulp.src('elm/*.elm')
    .pipe(elm.make({filetype: 'html', debug: true }))
    .pipe(gulp.dest('dest/'));
});

gulp.task('pipe', ['init'], function(){
  return gulp.src('elm/test1.elm')
    .pipe(elm())
    .pipe(uglify())
    .pipe(gulp.dest('dest/'));
});

function string_src(filename, string) {
  var src = require('stream').Readable({ objectMode: true })
  src._read = function () {
    this.push(new Vinyl({ cwd: "", base: "", path: filename, contents: Buffer.from(string) }))
    this.push(null)
  }
  return src
}

gulp.task('string', ['init'], function(){
  return string_src('test3.elm', fs.readFileSync('elm/test1.elm'))
    .pipe(elm())
    .pipe(gulp.dest('dest/'))
});

gulp.task('default', ['multi', 'pipe', 'string']);
