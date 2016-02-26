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

function whichHandler(opts) {
  return function(state){
    state.phase = 'which';
    var deferred = Q.defer();
    which(opts.exe, function(err, exe){
      if(!!err){
        deferred.reject({state: state, message: 'Failed to find ' + gutil.colors.magenta(opts.exe) + ' in your path.'});
      }
      state.exe = exe;
      deferred.resolve(state);
    });
    return deferred.promise;
  }.bind(this);
}
   
function tempHandler(opts) {
  return function(state){
    state.phase = 'make temp dir';
    var deferred = Q.defer();
    temp.mkdir({prefix: 'gulp-elm-tmp-'}, function(err, dirPath){
      if(err){deferred.reject({state: state, message: 'cannot make temporary directory.'}); }
      state.tmpDir = dirPath;
      state.tmpOut = temp.path({dir: state.dirPath, suffix: opts.ext});
      deferred.resolve(state);
    });
    return deferred.promise;
  }.bind(this);
}  

function checkInputExistsHandler(opts, file) {
  return function(state){
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
  }.bind(this)
}
    
function compileHandler(opts, file) { 
  return function(state){
    state.phase = 'compile';
    var deferred = Q.defer()
    , args = opts.args.concat(state.input, '--output', state.tmpOut);
    state.output = path.resolve(process.cwd(), path.basename(file.path, path.extname(file.path)) + opts.ext);
    compile(state.exe, args, function(err){
      if(!!err) { deferred.reject({state: state, message: err}); }
      else      { deferred.resolve(state); }
    });
    return deferred.promise;
  }.bind(this);
}

function bundleHandler(output, opts, files) {
  return function(state){
    state.phase = 'compile';
    state.output = path.resolve(process.cwd(), output);

    var deferred = Q.defer()
    , args = opts.args.concat(files, '--output', state.tmpOut);
    compile(state.exe, args, function(err){
      if(!!err) { deferred.reject({state: state, message: err}); }
      else      { deferred.resolve(state); }
    });
    return deferred.promise;
  }.bind(this);
}
    
function pushResultHandler() {
  return function(state){
    state.phase = 'push';
    var deferred = Q.defer();
    fs.readFile(state.tmpOut, function(err, contents){
      if(!!err) {deferred.reject({state: state, message: err}); }
      this.push(new gutil.File({
        path: state.output,
        contents: contents
      }));
      deferred.resolve(state);
    }.bind(this));
    return deferred.promise;
  }.bind(this);
}
  
function failHandler() {
  return function(rej){
    this.emit('error', new gutil.PluginError(PLUGIN, rej.message));
    return rej.state;
  }.bind(this);
}
  
function doneHandler(callback) { 
  return function(state){

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
  }.bind(this);
}

function make(options){
  var opts = processMakeOptions(options);

  function transform(file, encode, callback) {

    // null
    if(file.isNull()) {
      this.push(file);
      return callback();
    }

    // stream
    if(file.isStream()){
      this.emit('error', new gutil.PluginError(PLUGIN, 'Streams are not supported!'));
      return callback();
    }

    // buffer
    Q.when({phase: 'start'})
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
  if (!output) { throw new gutil.PluginError(PLUGIN, 'output filename is required when bundling.') }
  var opts = processMakeOptions(options, output);
  var files = [];
  
  function transform(file, encoding, callback) {
    files.push(file.path);
    callback();
  }
  
  function endStream(callback) {
    
    // buffer
    Q.when({phase: 'start'})
    .then(whichHandler.apply(this, [opts]))
    .then(tempHandler.apply(this, [opts]))
    .then(bundleHandler.apply(this, [output, opts, files]))
    .then(pushResultHandler.apply(this))
    .fail(failHandler.apply(this))
    .done(doneHandler.apply(this, [callback]));
  }
  
  return through.obj(transform, endStream);
}

module.exports      = make;
module.exports.make = make;
module.exports.bundle = bundle;
module.exports.init = init;
