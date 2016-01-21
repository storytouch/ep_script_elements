// Letter
// var GENERALS_PER_PAGE = 54;

// A4
var GENERALS_PER_PAGE = 58;

describe("ep_script_elements - dropdown", function(){
  var utils;
  before(function(){
    utils = ep_script_elements_test_helper.utils;
  });

  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(cb);
    this.timeout(60000);
  });

  it("changes option select when script element is changed", function(done) {
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    $firstTextElement.sendkeys('First Line!');

    // sets first line to heading
    utils.changeToElement(utils.HEADING);

    helper.waitFor(function(){
      // wait for element to be processed and changed
      $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
      return $firstTextElement.find("heading").length === 1;
    }).done(done);
  });

  it("clears style when General is selected", function(done) {
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    $firstTextElement.sendkeys('First Line!');

    // sets first line to heading
    utils.changeToElement(utils.HEADING);

    helper.waitFor(function(){
      // wait for element to be processed and changed
      $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
      return $firstTextElement.find("heading").length === 1;
    }).done(function(){
      // sets first line to general
      utils.changeToElement(utils.GENERAL);

      helper.waitFor(function(){
        // wait for element to be processed and changed
        $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
        return $firstTextElement.find("heading").length === 0;
      }).done(done);
    });
  });

  context("when pad has lines with different element types", function() {
    beforeEach(function(cb) {
      var inner$ = helper.padInner$;
      var $firstTextElement = inner$("div").first();

      // faster way to create two lines (1st is a scene heading, 2nd is an action)
      var firstLine = "<heading>First Line!</heading><br/>";
      var secondLine = "<action>Second Line!</action><br/>";
      $firstTextElement.html(firstLine + secondLine);

      // wait for Etherpad to finish processing lines
      helper.waitFor(function(){
        $secondTextElement = inner$("div").first().next();
        return $secondTextElement.text() === "Second Line!";
      }, 2000).done(cb);
    });

    it("sets select value according to the line caret is", function(done) {
      // this is a longer test, might need more time to finish
      this.timeout(10000);

      var chrome$ = helper.padChrome$;
      var inner$ = helper.padInner$;

      // places caret on heading
      var $heading = inner$("div").first();
      $heading.sendkeys("{selectall}");

      // validate select shows "Heading"
      helper.waitFor(function() {
        var selectedValue = chrome$('#script_element-selection option:selected').text();
        return selectedValue === "Heading";
      }, 2000).done(function() {
        // places caret on action
        var $action = inner$("div").first().next();
        $action.sendkeys("{selectall}");

        // validate select shows "Action"
        helper.waitFor(function() {
          var selectedValue = chrome$('#script_element-selection option:selected').text();
          return selectedValue === "Action";
        }, 2000).done(done);
      });
    });

    it("triggers event 'selectElementChange' when select value is changed", function(done) {
      // this is a longer test, might need more time to finish
      this.timeout(10000);

      var chrome$ = helper.padChrome$;
      var inner$ = helper.padInner$;

      // places caret on heading to force select value to not be "Action"
      var $heading = inner$("div").first();
      $heading.sendkeys("{selectall}");

      helper.waitFor(function() {
        var selectedValue = chrome$('#script_element-selection option:selected').text();
        return selectedValue === "Heading";
      }, 2000).done(function() {
        // listens to 'selectElementChange' event
        var eventTriggered = false;
        chrome$('#script_element-selection').on('selectElementChange', function() {
          eventTriggered = true;
        });

        // places caret on action so event can be triggered
        var $action = inner$("div").first().next();
        $action.sendkeys("{selectall}");

        // validate event was triggered
        helper.waitFor(function() {
          return eventTriggered;
        }, 3000).done(done);
      });
    });

  });

  context("when pad has a split element between two pages", function() {
    var FIRST_HALF = GENERALS_PER_PAGE - 3;
    var SECOND_HALF = GENERALS_PER_PAGE - 2;

    beforeEach(function(done) {
      var inner$ = helper.padInner$;

      var line1 = utils.buildStringWithLength(60, "1") + ".";
      var line2 = utils.buildStringWithLength(60, "2") + ".";
      var line3 = utils.buildStringWithLength(60, "3") + ".";
      var line4 = utils.buildStringWithLength(60, "4") + ".";
      var lastLineText = line1 + line2 + line3 + line4;

      var singleLineGenerals = utils.buildScriptWithGenerals("general", GENERALS_PER_PAGE - 3);
      var multiLineGeneral   = utils.general(lastLineText);
      var script             = singleLineGenerals + multiLineGeneral;

      utils.createScriptWith(script, lastLineText, function() {
        // wait for line to be split by pagination
        helper.waitFor(function() {
          var $splitElementsWithPageBreaks = inner$("div splitPageBreak");
          return $splitElementsWithPageBreaks.length === 1;
        }).done(done);
      });
    });

    it("changes 2nd half of split element when 1st half is changed", function(done) {
      var inner$ = helper.padInner$;

      var $firstHalfOfMultiLineElement = inner$("div").last().prev();
      $firstHalfOfMultiLineElement.sendkeys('{selectall}{leftarrow}');

      // sets half to action
      utils.changeToElement(utils.ACTION, function() {
        helper.waitFor(function(){
          // wait for element to be processed and changed
          $firstHalfOfMultiLineElement = inner$("div").last().prev();
          return $firstHalfOfMultiLineElement.find("action").length === 1;
        }).done(function() {
          // 2nd half should be an action too
          $secondHalfOfMultiLineElement = inner$("div").last();
          expect($secondHalfOfMultiLineElement.find("action").length).to.be(1);

          done();
        });
      }, FIRST_HALF);
    });

    it("changes 1st half of split element when 2nd half is changed", function(done) {
      var inner$ = helper.padInner$;

      var $secondHalfOfMultiLineElement = inner$("div").last();
      $secondHalfOfMultiLineElement.sendkeys('{selectall}{rightarrow}');

      // sets half to action
      utils.changeToElement(utils.ACTION, function() {
        helper.waitFor(function(){
          // wait for element to be processed and changed
          $secondHalfOfMultiLineElement = inner$("div").last();
          return $secondHalfOfMultiLineElement.find("action").length === 1;
        }).done(function() {
          // 1st half should be an action too
          $firstHalfOfMultiLineElement = inner$("div").last().prev();
          expect($firstHalfOfMultiLineElement.find("action").length).to.be(1);

          done();
        });
      }, SECOND_HALF);
    });
  });
});