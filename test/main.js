var assert = require('assert');
var jsdom  = require('jsdom');
var fs     = require('fs');
var elm    = require('..');
var gutil  = require('gulp-util');

function checkTest1(done){
  return function(file){
    assert(file.isBuffer());
    jsdom.env({
      html: '<html><body><script></script><body></html>',
      src:  [file.contents, "Elm.Test1.fullscreen()"],
      done: function(err, window){
        assert(!err);
        // TODO: need to figure out how to inspect the DOM element.
        // assert.equal(window.document.getElementById("hello").innerHTML, "Test");
        done();
      }
    });
  }
}

describe('gulp-elm', function(){

  before(function(done){
    this.timeout(30000);
    elm.init().then(done);
  });

  it('should compile Elm to js from virtual file.', function(done){
    var myElm = elm();
    myElm.write(new gutil.File({path: "dummy", contents: fs.readFileSync('test/test1.elm')}));
    myElm.once('data', checkTest1(done));
  });

  it('should compile Elm to js from real file.', function(done){
    var myElm = elm();
    myElm.write(new gutil.File({path: "test/test1.elm", contents: new Buffer('dummy')}));
    myElm.once('data', checkTest1(done));
  });

  it('should stop Elm to js failed.', function(done){
    var myElm = elm();
    myElm.write(new gutil.File({path: "test/fail.elm", contents: new Buffer('dummy')}));
    myElm.once('error', function(error){
      assert(error);
      assert.equal(error.plugin, 'gulp-elm');
      done();
    });
  });

  it('should compile Elm to html from real file.', function(done){
    var myElm = elm({filetype: 'html'});
    myElm.write(new gutil.File({path: "test/test1.elm", contents: new Buffer('dummy')}));
    myElm.once('data', function(file){
      assert(file.isBuffer());

      jsdom.env({
        html: file.contents,
        done: function(err, window){
          assert(!err);
          assert.equal(window.document.getElementsByTagName('script')[1].innerHTML, "Elm.Test1.fullscreen()");
          done();
        }
      });
    });
  });

  it('should bundle Elm files to js from virtual file.', function(done){
    var output = "bundle.js";
    var myElm = elm.bundle(output);
    myElm.write(new gutil.File({path: "test/test1.elm", contents: fs.readFileSync('test/test1.elm')}));
    myElm.end(new gutil.File({path: "test/test2.elm", contents: fs.readFileSync('test/test2.elm')}));
    myElm.once('data', function(file){
      assert(file.isBuffer());
      assert.equal(file.relative, output);
      done();
    });
  });

  it('should not error when bundling 0 Elm files.', function(done){
    var output = "bundle.js";
    var myElm = elm.bundle(output);
    myElm.end();
    myElm.once('data', function(file){
      assert.fail('Should not have any data');
    });
    myElm.once('end', done);
  });

  it('should error when output does not match filetype.', function(){
    var output = "bundle.js";
    try {
      var myElm = elm.bundle(output, {filetype: 'html'});
    } catch (error) {
      assert(error);
      assert.equal(error.plugin, 'gulp-elm');
      return;
    }

    assert.fail('Should have thrown exception');
  });

});
