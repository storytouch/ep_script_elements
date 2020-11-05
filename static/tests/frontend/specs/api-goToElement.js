describe('ep_script_elements - API - go to element', function() {
  var utils, apiUtils;
  var textOfFirstLine = 'line 1';
  var textOfSecondLine = 'line 2';

  before(function(cb) {
    this.timeout(6000);
    utils = ep_script_elements_test_helper.utils;
    apiUtils = ep_script_elements_test_helper.apiUtils;

    var lastLineText = textOfSecondLine;
    var general1 = utils.general(textOfFirstLine);
    var general2 = utils.general(textOfSecondLine);

    var script = general1 + general2;
    utils.newPad(function() {
      utils.createScriptWith(script, lastLineText, cb);
    });
  });

  context('when it receives a message to select the next element', function() {
    before(function() {
      apiUtils.simulateTriggerOfSelectNextElement();
    });

    it('selects the next element', (done) => {
      helper.waitFor(function() {
        var selectedText = helper.padInner$.document.getSelection().toString()
        return selectedText === textOfSecondLine;
      }, 4000).done(done);
    });
  });

  context('when it receives a message to select the previous element', function() {
    before(function() {
      helper.padInner$('div').last().sendkeys('{selectall}{rightarrow}');
      apiUtils.simulateTriggerOfSelectPreviousElement();
    });

    it('selects the previous element', (done) => {
      helper.waitFor(function() {
        var selectedText = helper.padInner$.document.getSelection().toString().replace('\n', '');
        return selectedText === textOfFirstLine;
      }, 4000).done(done);
    });
  });
});
