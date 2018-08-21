var assert     = require('assert');
var { JSDOM }  = require('jsdom');
var fs         = require('fs');
var path       = require('path');
var elm        = require('..');
var Vinyl      = require('vinyl');

function checkTest1(done){
  return function(file){
    assert(file.isBuffer());

    var html = '<html><body><script>' + file.contents + '</script><script>Elm.Test1.fullscreen()</script><body></html>';
    var { window } = new JSDOM(html, { runScripts: 'dangerously', });

    setTimeout(function testHello(){
      var hello = window.document.getElementById("hello");
      if (!hello) {
        setTimeout(testHello, 25);
        return
      }

      assert.equal(hello.innerHTML, "Test");

      done();
    }, 25);
  }
}

describe('gulp-elm', function(){

  var millisecondsPerSecond = 1000;
  var secondsPerMinute = 60;
  var elmMakeTimeoutInMinutes = 5;
  var elmMakeTimeout = millisecondsPerSecond * secondsPerMinute * elmMakeTimeoutInMinutes;
  this.timeout(elmMakeTimeout);

  before(function(){
    this.timeout(elmMakeTimeout);
    return elm.init({cwd: 'test/'});
  });

  it('should compile Elm to js from virtual file.', function(done){
    var myElm = elm({cwd: 'test/'});
    myElm.write(new Vinyl({path: "dummy", contents: fs.readFileSync('test/test1.elm')}));
    myElm.once('data', checkTest1(done));
  });

  it('should compile Elm to js from real file.', function(done){
    var myElm = elm({cwd: 'test/'});
    myElm.write(new Vinyl({path: path.resolve("test/test1.elm"), contents: Buffer.from('dummy')}));
    myElm.once('data', checkTest1(done));
  });

  it('should stop Elm to js failed.', function(done){
    var myElm = elm({cwd: 'test/'});
    myElm.write(new Vinyl({path: path.resolve("test/fail.elm"), contents: Buffer.from('dummy')}));
    myElm.once('error', function(error){
      assert(error);
      assert.equal(error.plugin, 'gulp-elm');
      done();
    });
  });

  it('should compile Elm to html from real file.', function(done){
    var myElm = elm({filetype: 'html', cwd: 'test/'});
    myElm.write(new Vinyl({path: path.resolve("test/test1.elm"), contents: Buffer.from('dummy')}));
    myElm.once('data', function(file){
      assert(file.isBuffer());

      var { window } = new JSDOM(file.contents);
      assert.equal(window.document.getElementsByTagName('script')[1].innerHTML, "Elm.Test1.fullscreen()");
      done();
    });
  });

  it('should bundle Elm files to js from virtual file.', function(done){
    var output = "bundle.js";
    var myElm = elm.bundle(output, {cwd: 'test/'});
    myElm.write(new Vinyl({path: path.resolve("test/test1.elm"), contents: fs.readFileSync('test/test1.elm')}));
    myElm.end(new Vinyl({path: path.resolve("test/test2.elm"), contents: fs.readFileSync('test/test2.elm')}));
    myElm.once('data', function(file){
      assert(file.isBuffer());
      assert.equal(file.relative, output);
      done();
    });
  });

  it('should not error when bundling 0 Elm files.', function(done){
    var output = "bundle.js";
    var myElm = elm.bundle(output, {cwd: 'test/'});
    myElm.end();
    myElm.once('data', function(file){
      assert.fail('Should not have any data');
    });
    myElm.once('end', done);
  });

  it('should error when output does not match filetype.', function(){
    var output = "bundle.js";
    try {
      var myElm = elm.bundle(output, {filetype: 'html', cwd: 'test/'});
    } catch (error) {
      assert(error);
      assert.equal(error.plugin, 'gulp-elm');
      return;
    }

    assert.fail('Should have thrown exception');
  });

});
