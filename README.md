gulp-elm
===

Example
---

```.js
var gulp = require('gulp');
var elm  = require('gulp-elm');

gulp.task('elm-init', elm.init);

gulp.task('elm', ['elm-init'], function(){
  return gulp.src('src/*.elm')
    .pipe(elm())
    .pipe(gulp.dest('dist/'));
});

gulp.task('elm-bundle', ['elm-init'], function(){
  return gulp.src('src/*.elm')
    .pipe(elm.bundle('bundle.js'))
    .pipe(gulp.dest('dist/'));
});
```

API
---

### `elm.init(options)`

execute `elm-make --yes`.

If you compile multi file, all elm tasks depends on `elm.init` task.

#### options

* `elmMake` (default: `"elm-make"`)

    `elm-make` executable file.

### `elm(options)` / `elm.make(options)`

compile elm files.

#### options

* `yesToAllPrompts` (default: `true`)

    add `--yes` option to `elm-make`.

* `elmMake` (default: `"elm-make"`)

    `elm-make` executable file.

* `filetype` (default: `"js"`)

    elm output file type.

    `"js"` (or `"javascript"`) or `"html"`.

* `warnings` (default: `false`)

    add `--warn` option to `elm-make`


### `elm.bundle(output, options)`

compile and bundle elm files into a single file.

#### output

  you must pass the name of the output file

#### options

* `yesToAllPrompts` (default: `true`)

    add `--yes` option to `elm-make`.

* `elmMake` (default: `"elm-make"`)

    `elm-make` executable file.

* `warnings` (default: `false`)

    add `--warn` option to `elm-make`
