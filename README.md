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
```

API
---

### `elm.init`

execute `elm-make --yes`.

If you compile multi file, all elm tasks depends on elm.init task.

### `elm` / `elm.make`

compile elm files.

#### options

* yesToAllPrompts (default: true)

    add --yes option to elm-make.

* elmMake (default: "elm-make")

    elm-make executable file.

* filetype (default: "js")

    elm output file type.

    js(javascript) or html.
