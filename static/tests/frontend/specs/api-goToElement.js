describe('ep_script_elements - API - go to element', function() {
  var utils = ep_script_elements_test_helper.utils;
  var apiUtils, eascUtils;
  var firstLineText = 'line 1';
  var lastLineText = 'HEADING';

  before(function(done) {
    this.timeout(10000);
    utils.newPad(function() {
      var smUtils = ep_script_scene_marks_test_helper.utils;
      apiUtils = ep_script_elements_test_helper.apiUtils;
      eascUtils = ep_script_toggle_view_test_helper.utils;

      var general = utils.general(firstLineText);
      var synopsis = smUtils.createSynopsis(lastLineText)
      var script = general + synopsis;

      utils.createScriptWith(script, lastLineText, function() {
        eascUtils.setEascMode(['scene', 'script']);
        done();
      });
    });
  });

  context('when it receives a message to select the next element', function() {
    before(function() {
      apiUtils.simulateTriggerOfSelectNextElement();
    });

    it('selects the next element', (done) => {
      helper.waitFor(function() {
        var selectedText = helper.padInner$.document.getSelection().toString()
        return selectedText === lastLineText;
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
        return selectedText === firstLineText;
      }, 4000).done(done);
    });
  });
});
