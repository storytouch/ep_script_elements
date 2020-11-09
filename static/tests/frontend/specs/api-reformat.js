describe('ep_script_elements - API - element type changed', function(){
  var utils, apiUtils;

  before(function(cb){
    utils = ep_script_elements_test_helper.utils;
    apiUtils = ep_script_elements_test_helper.apiUtils;
    utils.newPad(cb);
    this.timeout(60000);
  });

  context('when API receives a message that line was reformatted', function() {
    var inner$;
    var $firstTextElement;
    var textOfSecondLine = 'line 2';

    before(function(done) {
      this.timeout(6000);
      inner$ = helper.padInner$;

      var lastLineText = textOfSecondLine;
      var general1 = utils.general('line 1');
      var general2 = utils.general(textOfSecondLine);

      var script = general1 + general2;
      utils.createScriptWith(script, lastLineText, function() {
        apiUtils.resetLastDataSent();

        // sets first line to action
        apiUtils.simulateTriggerOfChangeElementType(utils.ACTION);
        done();
      });
    })

    it('changes the line type', function(done) {
      helper.waitFor(function(){
        // wait for element to be processed and changed
        $firstTextElement = inner$('div').first(); // need to get it again because line is changed by Content Collector
        return $firstTextElement.find('action').length === 1;
      }, 4000).done(done);
    });

    // test text selection
    it('selects the text of next visible element', function(done) {
      helper.waitFor(function() {
        var selectedText = inner$.document.getSelection().toString();
        return selectedText === textOfSecondLine;
      }, 4000).done(done);
    });
  })
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
