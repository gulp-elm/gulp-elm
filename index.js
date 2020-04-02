"use strict";

var PluginError = require("plugin-error"),
  log = require("fancy-log"),
  colors = require("ansi-colors"),
  Vinyl = require("vinyl"),
  through = require("through2"),
  which = require("which"),
  fs = require("fs"),
  path = require("path"),
  temp = require("temp").track(),
  spawn = require("cross-spawn"),
  Q = require("q"),
  defaultArgs = ["make"],
  PLUGIN = "gulp-elm";

function getDefaultExe() {
  try {
    var elm_dev = path.resolve("node_modules/.bin/elm");
    if (fs.statSync(elm_dev).isFile()) {
      return elm_dev;
    }
  } catch (err) {
    // local elm-make not available
  }

  return "elm";
}

function processElmOptions(options, output) {
  var args = defaultArgs,
    ext = ".js",
    exe = getDefaultExe(),
    spawn = {};

  if (!!options) {
    if (options.elm) {
      exe = options.elm;
    }

    if (options.warn === true) {
      args = args.concat(["--warn"]);
    }

    if (options.debug === true) {
      args = args.concat(["--debug"]);
    }

    if (options.optimize === true) {
      args = args.concat(["--optimize"]);
    }

    if (options.cwd) {
      spawn.cwd = options.cwd;
    }

    var ft = options.filetype;
    if (!!ft) {
      if (ft === "js" || ft === "javascript") {
        ext = ".js";
      } else if (ft == "html") {
        ext = ".html";
      } else {
        throw new PluginError(PLUGIN, "output filetype must be js or html.");
      }

      if (output && path.extname(output) !== ext) {
        throw new PluginError(
          PLUGIN,
          "output is " + path.extname(output) + ", but filetype is " + ext
        );
      }
    }
  }

  return { args: args, ext: ext, exe: exe, spawn: spawn };
}

function compile(exe, args, options, callback) {
  var proc = spawn(exe, args, options),
    bStderr = Buffer.alloc(0);

  proc.stderr.on("data", function(stderr) {
    bStderr = Buffer.concat([bStderr, Buffer.from(stderr)]);
  });

  proc.on("close", function(code) {
    callback(code, bStderr.toString());
  });
}

function whichHandler(opts) {
  return function(state) {
    state.phase = "which";
    var deferred = Q.defer();
    which(opts.exe, function(err, exe) {
      if (!!err) {
        deferred.reject({
          state: state,
          message:
            "Failed to find " + colors.magenta(opts.exe) + " in your path."
        });
      }
      state.exe = exe;
      deferred.resolve(state);
    });
    return deferred.promise;
  }.bind(this);
}

function tempHandler(opts) {
  return function(state) {
    state.phase = "make temp dir";
    var deferred = Q.defer();
    temp.mkdir({ prefix: "gulp-elm-tmp-" }, function(err, dirPath) {
      if (err) {
        deferred.reject({
          state: state,
          message: "cannot make temporary directory."
        });
      }
      state.tmpDir = dirPath;
      deferred.resolve(state);
    });
    return deferred.promise;
  }.bind(this);
}

function checkInputExistsHandler(opts, file) {
  return function(state) {
    state.phase = "check input";
    var deferred = Q.defer();
    state.tmpOut = temp.path({ dir: state.tmpDir, suffix: opts.ext });
    state.input = file.path;
    state.tmpInput = false;

    fs.exists(state.input, function(exists) {
      if (!exists) {
        state.tmpInput = true;
        state.input = temp.path({ dir: state.tmpDir, suffix: file.relative });
        fs.writeFile(state.input, file.contents, function() {
          deferred.resolve(state);
        });
      }
      deferred.resolve(state);
    });
    return deferred.promise;
  }.bind(this);
}

function compileHandler(opts, file) {
  return function(state) {
    state.phase = "compile";
    var deferred = Q.defer(),
      args = opts.args.concat(quote(state.input), "--output", state.tmpOut);
    state.output = path.resolve(
      process.cwd(),
      path.basename(file.path, path.extname(file.path)) + opts.ext
    );
    compile(state.exe, args, opts.spawn, function(err, warnings) {
      if (!!err) {
        deferred.reject({ state: state, message: warnings });
      } else {
        deferred.resolve({ state: state, warnings: warnings });
      }
    });
    return deferred.promise;
  }.bind(this);
}

function bundleHandler(output, opts, files) {
  return function(state) {
    state.phase = "compile";
    state.output = path.resolve(process.cwd(), output);
    state.tmpOut = temp.path({ dir: state.tmpDir, suffix: opts.ext });

    var deferred = Q.defer(),
      args = opts.args.concat(files.map(quote), "--output", state.tmpOut);
    compile(state.exe, args, opts.spawn, function(err, warnings) {
      if (!!err) {
        deferred.reject({ state: state, message: warnings });
      } else {
        deferred.resolve({ state: state, warnings: warnings });
      }
    });
    return deferred.promise;
  }.bind(this);
}

function quote(str) {
  return `"${str}"`
}

function pushResultHandler() {
  return function(result) {
    var state = result.state;
    state.phase = "push";
    if (result.warnings) {
      log(result.warnings);
    }
    var deferred = Q.defer();
    fs.readFile(
      result.state.tmpOut,
      function(err, contents) {
        if (!!err) {
          if (err.code !== "ENOENT") {
            deferred.reject({ state: state, message: err });
          } else {
            // compiled a file with no output
          }
        } else {
          this.push(
            new Vinyl({
              path: state.output,
              contents: contents
            })
          );
        }
        deferred.resolve(state);
      }.bind(this)
    );
    return deferred.promise;
  }.bind(this);
}

function failHandler() {
  return function(rej) {
    console.log(rej.message);
    this.emit("error", new PluginError(PLUGIN, rej.message));
    return rej.state;
  }.bind(this);
}

function doneHandler(callback) {
  return function(state) {
    function next() {
      fs.unlink(state.tmpOut, function() {
        fs.rmdir(state.tmpDir, function() {
          callback();
        });
      });
    }

    if (state.tmpInput) {
      fs.unlink(state.input, function() {
        next();
      });
    } else {
      next();
    }
  }.bind(this);
}

function make(options) {
  var opts = processElmOptions(options);

  function transform(file, encode, callback) {
    // null
    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    // stream
    if (file.isStream()) {
      this.emit("error", new PluginError(PLUGIN, "Streams are not supported!"));
      return callback();
    }

    // buffer
    Q.when({ phase: "start" })
      .then(whichHandler.apply(this, [opts]))
      .then(tempHandler.apply(this, [opts]))
      .then(checkInputExistsHandler(opts, file))
      .then(compileHandler.apply(this, [opts, file]))
      .then(pushResultHandler.apply(this))
      .fail(failHandler.apply(this))
      .done(doneHandler.apply(this, [callback]));
  } // end of transform

  return through.obj(transform);
}

function bundle(output, options) {
  if (!output) {
    throw new PluginError(PLUGIN, "output filename is required when bundling.");
  }
  var opts = processElmOptions(options, output);
  var files = [];

  function transform(file, encoding, callback) {
    files.push(file.path);
    callback();
  }

  function endStream(callback) {
    if (files.length === 0) {
      callback();
      return;
    }
    // buffer
    Q.when({ phase: "start" })
      .then(whichHandler.apply(this, [opts]))
      .then(tempHandler.apply(this, [opts]))
      .then(bundleHandler.apply(this, [output, opts, files]))
      .then(pushResultHandler.apply(this))
      .fail(failHandler.apply(this))
      .done(doneHandler.apply(this, [callback]));
  }

  return through.obj(transform, endStream);
}

module.exports = make;
module.exports.make = make;
module.exports.bundle = bundle;
