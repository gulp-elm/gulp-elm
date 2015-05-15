'use strict';

var gutil         = require('gulp-util')
  , through       = require('through2')
  , which         = require('which')
  , fs            = require('fs')
  , path          = require('path')
  , temp          = require('temp')
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
    if(!!code) { callback(bStderr.toString()); }
    callback(null);
  });
}

function init(options) {
  var opts = processMakeOptions(options);
  var deferred = Q.defer();

  compile(opts.exe, ['--yes'], function(err){
    if(!!err) { deferred.reject(new gutil.PluginError(PLUGIN, err)); }
    else      { deferred.resolve();   }
  });

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
          console.log(gutil.colors.yellow('WARN: ') + 'Failed to find ' + gutil.colors.magenta("elm-make") + ' in your path. Trying to use local ' + opts.exe)
          state.exe = opts.exe;
//      deferred.reject({state: state, message: 'Failed to find ' + gutil.colors.magenta(opts.exe) + ' in your path.'});
        }
    		else{
    			state.exe = exe;
    		}
        deferred.resolve(state);
      });
      return deferred.promise;
    })

    // make temp dir
    .then(function(state){
      state.phase = 'make temp dir';
      var deferred = Q.defer();
      temp.mkdir({prefix: 'gulp-elm-tmp-'}, function(err, dirPath){
        if(err){deferred.reject({state: state, message: 'cannot make temporary directory.'}); }
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
      state.tmpInput = false;

      fs.exists(state.input, function(exists){
        if(!exists) {
          state.tmpInput = true;
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
      compile(state.exe, args, function(err){
        if(!!err) { deferred.reject({state: state, message: err}); }
        else      { deferred.resolve(state); }
      });
      return deferred.promise;
    })

    // push result
    .then(function(state){
      state.phase = 'push';
      var deferred = Q.defer();
      fs.readFile(state.tmpOut, function(err, contents){
        if(!!err) {deferred.reject({state: state, message: err}); }
        _this.push(new gutil.File({
          path: state.output,
          contents: contents
        }));
        deferred.resolve(state);
      });
      return deferred.promise;
    })

    .fail(function(rej){
      _this.emit('error', new gutil.PluginError(PLUGIN, rej.message));
      return rej.state;
    })

    .done(function(state){

      function next() {
        fs.unlink(state.tmpOut, function(){
          fs.rmdir(state.tmpDir, function(){
            callback();
          });
        });
      }

      if(state.tmpInput) {
        fs.unlink(state.input, function(){
          next();
        });
      } else {
        next();
      }

    });

  } // end of transform

  return through.obj(transform);
}

module.exports      = make;
module.exports.make = make;
module.exports.init = init;
