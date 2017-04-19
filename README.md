gulp-elm
===

Example
---

```.js
var gulp = require('gulp');
var elm  = require('gulp-elm');

gulp.task('elm-init', elm.init);

gulp.task('elm', ['elm-init'], function(){
    function onErrorHandler(err) {
        console.log(err);
    }

  return gulp.src('src/*.elm')
    .pipe(elm())
    .on('error', onErrorHandler)
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

* `elmMake` (default: `"node_modules/.bin/elm-make"` if it exists, otherwise `"elm-make"`)

    `elm-make` executable file.

* `cwd` (default: current working directory)

    The working directory in which to execute `elm-make` (this should be the directory with `elm-package.json`).

### `elm(options)` / `elm.make(options)`

compile elm files.

#### options

* `yesToAllPrompts` (default: `true`)

    add `--yes` option to `elm-make`.

* `elmMake` (default: `"node_modules/.bin/elm-make"` if it exists, otherwise `"elm-make"`)

    `elm-make` executable file.

* `cwd` (default: current working directory)

    The working directory in which to execute `elm-make` (this should be the directory with `elm-package.json`).

* `filetype` (default: `"js"`)

    elm output file type.

    `"js"` (or `"javascript"`) or `"html"`.

* `warn` (default: `false`)

    add `--warn` option to `elm-make`

* `debug` (default: `false`)

    add `--debug` option to `elm-make` (for Elm 0.18)

### `elm.bundle(output, options)`

compile and bundle elm files into a single file.

#### output

  you must pass the name of the output file

#### options

* `yesToAllPrompts` (default: `true`)

    add `--yes` option to `elm-make`.

* `elmMake` (default: `"node_modules/.bin/elm-make"` if it exists, otherwise `"elm-make"`)

    `elm-make` executable file.

* `cwd` (default: current working directory)

    The working directory in which to execute `elm-make` (this should be the directory with `elm-package.json`).

* `warn` (default: `false`)

    add `--warn` option to `elm-make`

* `debug` (default: `false`)

    add `--debug` option to `elm-make` (for Elm 0.18)
