describe('ep_script_elements - API - delete element', function() {
  var utils = ep_script_elements_test_helper.utils;
  var apiUtils, eascUtils;
  var lastLineText = 'action';
  var actionLineNumber = 0;
  var headingLineNumber = 2;
  var titleLineNumber = 1;
  var inner$;
  var initialNumberOfElements;

  before(function(done) {
    this.timeout(10000);
    utils.newPad(function() {
      var smUtils = ep_script_scene_marks_test_helper.utils;
      apiUtils = ep_script_elements_test_helper.apiUtils;
      eascUtils = ep_script_toggle_view_test_helper.utils;
      inner$ = helper.padInner$;

      var action = utils.action('action');
      var synopsis1 = smUtils.createSynopsis('first heading')
      var synopsis2 = smUtils.createSynopsis('second heading')
      var script = action +
        synopsis1 + action +
        synopsis2 + action;

      utils.createScriptWith(script, lastLineText, function() {
        eascUtils.setEascMode(['scene', 'script']);
        done();
      });
    });
  });

  context('when the current line is a non scene mark line', function() {
    before(function(done) {
      this.timeout(4000);
      initialNumberOfElements = inner$('div').length;
      utils.placeCaretInTheBeginningOfLine(actionLineNumber, function() {
        setTimeout(function() {
          apiUtils.simulateTriggerOfDeleteElement();
          done();
        }, 2000);
      })
    });

    it('deletes the current element', (done) => {
      helper.waitFor(function() {
        var currentNumberOfHeadings = inner$('div').length;
        return currentNumberOfHeadings === initialNumberOfElements - 1;
      }, 4000).done(done);
    });
  });

  context('when the current line is a heading', function() {
    before(function(done) {
      this.timeout(4000);
      initialNumberOfElements = inner$('div').length;
      utils.placeCaretInTheBeginningOfLine(headingLineNumber, function() {
        setTimeout(function() {
          apiUtils.simulateTriggerOfDeleteElement();
          done();
        }, 2000);
      });
    });

    it('deletes the current element', (done) => {
      helper.waitFor(function() {
        var currentNumberOfHeadings = inner$('div').length;
        return currentNumberOfHeadings === initialNumberOfElements - 3;
      }, 4000).done(done);
    });
  });

  context('when the current line is a title', function() {
    before(function(done) {
      this.timeout(4000);
      initialNumberOfElements = inner$('div').length;
      utils.placeCaretInTheBeginningOfLine(titleLineNumber, function() {
        setTimeout(function() {
          apiUtils.simulateTriggerOfDeleteElement();
          done();
        }, 2000);
      })
    });

    it('does not delete the scene mark', (done) => {
      helper.waitFor(function() {
        var currentNumberOfHeadings = inner$('div').length;
        return currentNumberOfHeadings < initialNumberOfElements;
      })
      .done(function() {
        expect().fail(function() { return 'scene mark should not be deleted' });
      })
      .fail(function() {
        done();
      });
    });
  });
});
