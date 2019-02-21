var       supertest = require('ep_etherpad-lite/node_modules/supertest'),
              utils = require('../../../utils'),
          createPad = utils.createPad,
          setHTML   = utils.setHTML,
          getHTML   = utils.getHTML,
         apiVersion = 1;
       randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

var errorMessage = function(expected, actual){
  return "Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + actual;
}

var buildExpectedHTML = function(html){
  return "<!DOCTYPE HTML><html><body>"+html+"<general></general><br></body></html>";
}

var buildHTML = function(html){
  return "<html><body>"+html+"</body></html>";
}

var INVALID_SCENE_ATTRIB = "<scene-invalid class=\"1\"><empty/></scene-invalid>";
var SCENE_WORKSTATE_ON_ETHERPAD = "<scene-workstate class=\"whatever\"><empty/></scene-workstate>";
var OTHER_SCENE_WORKSTATE_ON_ETHERPAD = "<scene-workstate class=\"end\"><empty/></scene-workstate>";
var SCENE_WORKSTATE_WITH_SPECIAL_CHARS_ON_ETHERPAD = "<scene-workstate class=\"=>'arrow'<=\"><empty\></scene-workstate>";
var SCENE_NUMBER_ON_ETHERPAD = "<scene-number class=\"1\"><empty/></scene-number>";
var SCENE_NUMBER_AND_WORKSTATE_ON_HTML = "<scene scene-number=\"1\" scene-workstate=\"whatever\"></scene>";

var SCENE_ON_ETHERPAD = `<heading><scene>${SCENE_WORKSTATE_ON_ETHERPAD}</scene>Once upon a time</heading>`;
var SCENE_ON_HTML = "<heading><scene scene-workstate=\"whatever\"></scene>Once upon a time</heading>";

var OTHER_SCENE_ON_ETHERPAD = `<heading><scene>${OTHER_SCENE_WORKSTATE_ON_ETHERPAD}</scene>The End</heading>`;
var OTHER_SCENE_ON_HTML = "<heading><scene scene-workstate=\"end\"></scene>The End</heading>";

var SCENE_WITH_SPECIAL_CHARS_ON_ETHERPAD = `<heading><scene>${SCENE_WORKSTATE_WITH_SPECIAL_CHARS_ON_ETHERPAD}</scene>Once upon a time</heading>`;
var SCENE_WITH_SPECIAL_CHARS_ON_HTML = "<heading><scene scene-workstate=\"=&gt;&#x27;arrow&#x27;&lt;=\"></scene>Once upon a time</heading>";

var SCENE_WITH_INVALID_ATTRIB_ON_ETHERPAD = `<heading><scene>${SCENE_WORKSTATE_ON_ETHERPAD}${INVALID_SCENE_ATTRIB}</scene>Once upon a time</heading>`;

var SCENE_WITH_WORKSTATE_AND_SCENE_NUMBER_ON_ETHERPAD = `<heading><scene>${SCENE_WORKSTATE_ON_ETHERPAD}${SCENE_NUMBER_ON_ETHERPAD}</scene>Once upon a time</heading>`;
var SCENE_WITH_WORKSTATE_AND_SCENE_NUMBER_ON_HTML = `<heading>${SCENE_NUMBER_AND_WORKSTATE_ON_HTML}Once upon a time</heading>`;

var SIMPLE_SCENE = "<heading>The End</heading>";
var ACTION = "<action>The End</action>";

describe('read scenes data', function(){
  var padID, html, expected;
  expected = buildExpectedHTML("");
  //create a new pad before each test run
  beforeEach(function(done){
    padID = randomString(5);

    createPad(padID, function() {
      setHTML(padID, html(), done);
    });
  })

  context('when pad has no scene', function(){

    before(function() {
      html = function() {
        return buildHTML("");
      }
    });

    it('gets html without a heading', function(done) {
      getHTML(padID, function(err, html_res){
        if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
        done();
      });
    })
  });

  context('when pad has one scene', function(){

    before(function() {
      html = function() {
        return buildHTML(SCENE_ON_ETHERPAD);
      }
    });

    it('gets html processed when exported', function(done) {
      expected = buildExpectedHTML(`${SCENE_ON_HTML}<br>`);
      getHTML(padID, function(err, html_res){
        if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
        done();
      });
    });

    context('and scene has workstate and number as attributes', function(){

      before(function() {
        html = function() {
          return buildHTML(SCENE_WITH_WORKSTATE_AND_SCENE_NUMBER_ON_ETHERPAD);
        }
      });

      it('gets html processed when exported', function(done) {
        expected = buildExpectedHTML(`${SCENE_WITH_WORKSTATE_AND_SCENE_NUMBER_ON_HTML}<br>`);
        getHTML(padID, function(err, html_res){
          if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
          done();
        });
      });
    });

    context('and scene has name and a invalid attribute as attribute', function(){

      before(function() {
        html = function() {
          return buildHTML(SCENE_WITH_INVALID_ATTRIB_ON_ETHERPAD);
        }
      });

      it('exports only name attribute', function(done) {
        expected = buildExpectedHTML(`${SCENE_ON_HTML}<br>`);
        getHTML(padID, function(err, html_res){
          if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
          done();
        });
      });
    });
    context('and scene has number, duration, temporality, workstate and time as attributes', function(){

      before(function() {
        html = function() {
          return buildHTML("<heading><scene>" +
            "<scene-number class=\"11\"><empty/></scene-number>" +
            "<scene-duration class=\"30\"><empty/></scene-duration>" +
            "<scene-temporality class=\"PRESENT\"><empty/></scene-temporality>" +
            "<scene-workstate class=\"IMMATURE\"><empty/></scene-workstate>" +
            "<scene-time class=\"20\"><empty/></scene-time>" +
            "Once upon a time</heading><br>");
        }
      });

      it('gets html processed when exported', function(done) {
        expected = buildExpectedHTML("<heading><scene scene-number=\"11\" scene-duration=\"30\" scene-temporality=\"PRESENT\" scene-workstate=\"IMMATURE\" scene-time=\"20\"></scene>Once upon a time</heading><br>");
        getHTML(padID, function(err, html_res){
          if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
          done();
        });
      });
    });
  });

  context('when pad has two scenes', function(){

    before(function() {
      html = function() {
        return buildHTML(`${SCENE_ON_ETHERPAD}<br>${OTHER_SCENE_ON_ETHERPAD}`);
      }
    });

    it('gets two headings when exported', function(done) {
      expected = buildExpectedHTML(`${SCENE_ON_HTML}<br>${OTHER_SCENE_ON_HTML}<br>`);
      getHTML(padID, function(err, html_res){
        if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
        done();
      });
    });
  });

  context('when pad has two scenes first one without scene-workstate', function(){

    before(function() {
      html = function() {
        return buildHTML(`${SCENE_ON_ETHERPAD}<br>${SIMPLE_SCENE}`);
      }
    });

    it('gets two headings when exported', function(done) {
      expected = buildExpectedHTML(`${SCENE_ON_HTML}<br>${SIMPLE_SCENE}<br>`);
      getHTML(padID, function(err, html_res){
        if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
        done();
      });
    });
  });

  context('when pad has one scene and one action', function(){

    before(function() {
      html = function() {
        return buildHTML(`${SCENE_ON_ETHERPAD}<br>${ACTION}`);
      }
    });

    it('gets a heading with attributes and one action', function(done) {
      expected = buildExpectedHTML(`${SCENE_ON_HTML}<br>${ACTION}<br>`);
      getHTML(padID, function(err, html_res){
        if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
        done();
      });
    });
  });

  context('when pad has one action and one scene', function(){

    before(function() {
      html = function() {
        return buildHTML(`${ACTION}<br>${SCENE_ON_ETHERPAD}`);
      }
    });

    it('gets an action and a heading with attributes', function(done) {
      expected = buildExpectedHTML(`${ACTION}<br>${SCENE_ON_HTML}<br>`);
      getHTML(padID, function(err, html_res){
        if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
        done();
      });
    });
  });

  context('when scene tag has special chars', function(){
    before(function() {
      html = function() {
        return buildHTML(`${ACTION}<br>${SCENE_WITH_SPECIAL_CHARS_ON_ETHERPAD}`);
      }
    });

    it('gets scene-workstate escaped', function(done) {
      expected = buildExpectedHTML(`${ACTION}<br>${SCENE_WITH_SPECIAL_CHARS_ON_HTML}<br>`);
      getHTML(padID, function(err, html_res){
        if(expected !== html_res) throw new Error(errorMessage(expected, html_res));
        done();
      });
    });
  });

});
