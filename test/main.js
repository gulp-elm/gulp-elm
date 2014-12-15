var assert = require('assert');
var jsdom  = require('jsdom');
var fs     = require('fs');
var elm    = require('..');
var gutil  = require('gulp-util');

function checkTest1(done){
  return function(file){
    assert(file.isBuffer());

    jsdom.env({
      html: '<html></html>',
      src:  [file.contents, "Elm.fullscreen(Elm.Test1)"],
      done: function(err, window){
        assert(!err);
        assert.equal(window.document.getElementById("hello").innerHTML, "Test");
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
    myElm.write(new gutil.File({path: "dummy", contents: fs.readFileSync('test/test.elm')}));
    myElm.once('data', checkTest1(done));
  });

  it('should compile Elm to js from real file.', function(done){
    var myElm = elm();
    myElm.write(new gutil.File({path: "test/test.elm", contents: new Buffer('dummy')}));
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
    myElm.write(new gutil.File({path: "test/test.elm", contents: new Buffer('dummy')}));
    myElm.once('data', function(file){
      assert(file.isBuffer());

      jsdom.env({
        html: file.contents,
        done: function(err, window){
          assert(!err);
          assert.equal(window.document.getElementsByTagName('script')[1].innerHTML, "Elm.fullscreen(Elm.Test1)");
          done();
        }
      });
    });
  });
});
