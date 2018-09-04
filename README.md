# gulp-elm

[![Greenkeeper badge](https://badges.greenkeeper.io/gulp-elm/gulp-elm.svg)](https://greenkeeper.io/)

## Example

```.js
var gulp = require('gulp');
var elm  = require('gulp-elm');

gulp.task('elm', function(){
  return gulp.src('src/Main.elm', { optimize: true })
    .pipe(elm())
    .pipe(gulp.dest('dist/'));
});

gulp.task('elm-bundle', function(){
  return gulp.src('src/**/Main.elm', { optimize: true })
    .pipe(elm.bundle('bundle.js'))
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

- 0.8.0
  - Elm 0.19 support (drops support for ELm 0.18 and lower)
  - Thanks to [@vodik](https://github.com/vodik) from [@sangoma](https://github.com/sangoma) for help with this upgrade!
  - Support Gulp 4 and Node.js 10
- 0.7.x
  - Add `cwd` option
- 0.6.x
  - Add `debug` option for Elm 0.18
