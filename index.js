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
    which(opts.exe, function(err){
      if(!!err) {
        var msg = 'Failed to find ' + gutil.colors.magenta(opts.exe) + ' in your path.'
        throw new gutil.PluginError(PLUGIN, msg);
      }

      temp.mkdir({prefix: 'gulp-elm-tmp-'}, function(err, dirPath){
        if(err){_this.emit('error', new gutil.PluginError(PLUGIN, 'cannot make temporary directory.'));}

        var tmpOut = temp.path({dir: dirPath, suffix: opts.ext})
          , input  = file.path;
        fs.exists(input, function(e){
          if(!e) {
            input = temp.path({dir: dirPath, suffix: file.relative});
            fs.writeFileSync(input, file.contents);
          }

          var args    = opts.args.concat(input, '--output', tmpOut)
            , output  = path.resolve(process.cwd(), path.basename(file.path, path.extname(file.path)) + opts.ext);

          try {
            compile(opts.exe, args, function(){
              fs.readFile(tmpOut, function(err, contents){
                if(!!err) {_this.emit('error', new gutil.PluginError(PLUGIN, err));}
                _this.push(new gutil.File({
                  path: output,
                  contents: contents
                }));
                return callback();
              }); // end of readFile
            }); // end of compile
          } catch (e) {_this.emit('error', e); }

        }); // end of exists

      }); // end of buffer
    }); // end of which
  } // end of transform

  return through.obj(transform);
}

module.exports      = make;
module.exports.make = make;
module.exports.init = init;
