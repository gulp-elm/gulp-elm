# gulp-elm

[![Build Status](https://dev.azure.com/gulp-elm/gulp-elm/_apis/build/status/gulp-elm.gulp-elm?branchName=master)](https://dev.azure.com/gulp-elm/gulp-elm/_build/latest?definitionId=1&branchName=master)

A plugin to compile Elm files with Gulp (or other [Vinyl](https://npmjs.com/package/vinyl) sources).
The latest version (0.8.x) only supports Elm 0.19, use 0.7.x to compile earlier versions of Elm.

## Example

```.js
var gulp = require('gulp');
var elm  = require('gulp-elm');

gulp.task('elm', function(){
  return gulp.src('src/Main.elm')
    .pipe(elm({ optimize: true }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('elm-bundle', function(){
  return gulp.src('src/**/Main.elm')
    .pipe(elm.bundle('bundle.js', { optimize: true }))
    .pipe(gulp.dest('dist/'));
});
```

## API

### `elm(options)` / `elm.make(options)`

compile elm files.

#### options

- `elm` (default: `"node_modules/.bin/elm"` if it exists, otherwise `"elm"`)

  `elm` executable file.

- `cwd` (default: current working directory)

  The working directory in which to execute `elm` (this should be the directory with `elm.json`).

- `filetype` (default: `"js"`)

  elm output file type.

  `"js"` (or `"javascript"`) or `"html"`.

- `filename`

  The filename passed into `--output` (this overrides the `filetype` option).

- `optimize` (default: `false`)

  add `--optimize` option to `elm`

- `debug` (default: `false`)

  add `--debug` option to `elm`

### `elm.bundle(output, options)`

compile and bundle elm files into a single file.

#### output

you must pass the name of the output file

#### options

- `elm` (default: `"node_modules/.bin/elm"` if it exists, otherwise `"elm"`)

  `elm` executable file.

- `cwd` (default: current working directory)

  The working directory in which to execute `elm` (this should be the directory with `elm.json`).

- `optimize` (default: `false`)

  add `--optimize` option to `elm`

- `debug` (default: `false`)

  add `--debug` option to `elm`

## Changes

- 0.8.2
  - Update confusing error message (fixes [#46](https://github.com/gulp-elm/gulp-elm/pull/46), thanks [@barbeque](https://github.com/barbeque)!)
- 0.8.1
  - Fix error when compiling file with no output (fixes [#37](https://github.com/gulp-elm/gulp-elm/issues/37))
- 0.8.0
  - Elm 0.19 support (drops support for Elm 0.18 and lower)
  - Thanks to [@vodik](https://github.com/vodik) from [@sangoma](https://github.com/sangoma) for help with this upgrade!
- 0.7.3
  - Support Gulp 4 and Node.js 10
- 0.7.x
  - Add `cwd` option
- 0.6.x
  - Add `debug` option for Elm 0.18
