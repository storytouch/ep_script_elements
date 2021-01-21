describe('ep_script_elements - copy/paste', function() {
  var helperFunctions, utils;

  before(function(done) {
    utils = ep_script_elements.utils;
    helperFunctions = ep_script_elements.copyPaste;
    done();
  });

  context('when user copies a text with script elements', function() {
    before(function(done) {
      helperFunctions.createScriptDocumentPad(function(callback) {
        helperFunctions.copyAllContent();
        done();
      });

      this.timeout(60000);
    });

    context('and pastes in a TextDocumentPad', function() {
      before(function(done) {
        helperFunctions.createTextDocumentPad(function() {
          helperFunctions.pasteAfterLine(0, done);
        });
        this.timeout(5000);
      });

      it('preserves the text content', function(done) {
        helper
          .waitFor(function() {
            var isFirstLineTextPreserved = helper.padInner$('div').eq(9).text() === 'scene';
            var isSecondLineTextPreserved = helper.padInner$('div').eq(10).text() === 'action';
            return isFirstLineTextPreserved && isSecondLineTextPreserved;
          })
          .done(done);
      });

      it('does not preserve script element types', function(done) {
        helper
          .waitFor(function() {
            var isHeadingTypeRemoved = helper.padInner$('heading').length === 0;
            var isActionTypeRemoved = helper.padInner$('action').length === 0;
            return isHeadingTypeRemoved && isActionTypeRemoved;
          })
          .done(done);
      });
    });
  });
});

var ep_script_elements = ep_script_elements || {};
ep_script_elements.copyPaste = {
  createTextDocumentPad: function(cb) {
    var epSEUtils = ep_script_elements_test_helper.utils;
    var padType = epSEUtils.TEXT_DOCUMENT_TYPE;
    epSEUtils.newPadWithType(cb, padType);
  },
  createScriptDocumentPad: function(cb) {
    var epSEUtils = ep_script_elements_test_helper.utils;
    var epSMUtils = ep_script_scene_marks_test_helper.utils;
    var padType = epSEUtils.SCRIPT_DOCUMENT_TYPE;
    epSEUtils.newPadWithType(function() {
      var episode = epSMUtils.createEpi('scene');
      var action = epSMUtils.action('action');
      var script = episode + action;
      epSMUtils.createScriptWith(script, 'action', cb);
    }, padType);
  },
  copyAllContent: function(lineNumber) {
    var $firstLine = helper.padInner$('div').first();
    var $lastLine = helper.padInner$('div').last();
    helper.selectLines($firstLine, $lastLine);
    ep_script_copy_cut_paste_test_helper.utils.copy();
  },
  pasteAfterLine: function(lineNumber, cb) {
    var totalLines = helper.padInner$('div').length;

    // adds a new empty line
    var $targetLine = helper.padInner$('div').eq(lineNumber);
    $targetLine.sendkeys('{selectall}{rightarrow}{enter}{enter}');

    helper
      .waitFor(function() {
        return helper.padInner$('div').length > totalLines;
      }, 4000)
      .done(function() {
        // paste the content
        ep_script_copy_cut_paste_test_helper.utils.pasteAtTheEndOfLine(lineNumber + 1, cb);
      });
  },
};
