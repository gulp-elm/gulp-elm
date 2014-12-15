'use strict';

var gutil         = require('gulp-util')
  , through       = require('through2')
  , which         = require('which')
  , fs            = require('fs')
  , path          = require('path')
  , temp          = require('temp').track()
  , child_process = require('child_process')
  , Q             = require('q')
  , elm_make      = 'elm-make'
  , defaultArgs   = ['--yes']
  , PLUGIN        = 'gulp-elm';

function processMakeOptions(options) {
  var args   = defaultArgs
    , ext    = '.js'
    , exe    = elm_make;

  if(!!options){
    var yes = options.yesToAllPrompts;
    if(yes !== undefined && !yes) {
      args = [];
    }

    if(options.elmMake) { exe = options.elmMake; }

    var ft = options.filetype;
    if(!!ft) {
      if(ft === 'js' || ft === 'javascript') { ext = '.js'; }
      else if (ft == 'html') { ext = '.html'; }
      else { throw new gutil.PluginError(PLUGIN, 'filetype is js or html.'); }
    }
  }

  return {args: args, ext: ext, exe: exe};
}

function compile(exe, args, callback){
  var proc    = child_process.spawn(exe, args)
    , bStderr = new Buffer(0);

  proc.stderr.on('data', function(stderr){
    bStderr = Buffer.concat([bStderr, new Buffer(stderr)]);
  });

  proc.on('close', function(code){
    if(!!code) { throw new gutil.PluginError(PLUGIN, bStderr.toString()); }
    callback();
  });
}

function init(options) {
  var opts = processMakeOptions(options);
  var deferred = Q.defer();

  try {
    compile(opts.exe, ['--yes'], function(){
      deferred.resolve();
    });
  } catch (e) {
    deferred.reject(e);
  }

  return deferred.promise;
}

function make(options){
  var opts = processMakeOptions(options);

  function transform(file, encode, callback) {
    var _this = this;

    // null
    if(file.isNull()) {
      _this.push(file);
      return callback();
    }

    // stream
    if(file.isStream()){
      _this.emit('error', new gutil.PluginError(PLUGIN, 'Streams are not supported!'));
      return callback();
    }

    // buffer
    Q.when({phase: 'start'})

    // which
    .then(function(state){
      state.phase = 'which';
      var deferred = Q.defer();
      which(opts.exe, function(err, exe){
        if(!!err){
          var msg = 'Failed to find ' + gutil.colors.magenta(opts.exe) + ' in your path.';
          deferred.fail(new gutil.PluginError(PLUGIN, msg));
        }
        state.exe = exe;
        deferred.resolve(state);
      });
      return deferred.promise;
    })

    // make temp dir
    .then(function(state){
      state.phase = 'make temp dir';
      var deferred = Q.defer();
      temp.mkdir({prefix: 'gulp-elm-tmp-'}, function(err, dirPath){
        if(err){deferred.fail(new gutil.PluginError(PLUGIN, 'cannot make temporary directory.'));}
        state.tmpDir = dirPath;
        deferred.resolve(state);
      });
      return deferred.promise;
    })

    // check input exists
    .then(function(state){
      state.phase = 'check input';
      var deferred = Q.defer();
      state.tmpOut = temp.path({dir: state.dirPath, suffix: opts.ext});
      state.input  = file.path;

      fs.exists(state.input, function(exists){
        if(!exists) {
          state.input = temp.path({dir: state.dirPath, suffix: file.relative});
          fs.writeFile(state.input, file.contents, function(){
            deferred.resolve(state);
          });
        }
        deferred.resolve(state);
      });
      return deferred.promise;
    })

    // compile
    .then(function(state){
      state.phase = 'compile';
      var deferred = Q.defer()
        , args = opts.args.concat(state.input, '--output', state.tmpOut);
      state.output = path.resolve(process.cwd(), path.basename(file.path, path.extname(file.path)) + opts.ext);
      try {
        compile(state.exe, args, function(){
          deferred.resolve(state);
        });
      } catch (e) {
        deferred.fail(e);
      }
      return deferred.promise;
    })

    // push result
    .then(function(state){
      state.phase = 'push';
      var deferred = Q.defer();
      fs.readFile(state.tmpOut, function(err, contents){
        if(!!err) {deferred.fail(new gutil.PluginError(PLUGIN, err)); }
        _this.push(new gutil.File({
          path: state.output,
          contents: contents
        }));
        deferred.resolve(state);
      });
      return deferred.promise;
    })

    .fail(function(err){
      _this.emit('error', err);
    })

    .done(function(){
      callback();
    });

  } // end of transform

  return through.obj(transform);
}

module.exports      = make;
module.exports.make = make;
module.exports.init = init;
