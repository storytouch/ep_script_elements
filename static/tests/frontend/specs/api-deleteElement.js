describe('ep_script_elements - API - delete element', function() {
  var utils = ep_script_elements_test_helper.utils;
  var apiUtils, eascUtils, smUtils;
  var lastLineText = 'action 3';
  var actionLineNumber = 0;
  var headingLineNumber = 3;
  var titleLineNumber = 5;
  var lastActionLineNumber = 8;
  var inner$;
  var initialNumberOfElements;

  before(function(done) {
    this.timeout(10000);
    utils.newPad(function() {
      smUtils = ep_script_scene_marks_test_helper.utils;
      apiUtils = ep_script_elements_test_helper.apiUtils;
      eascUtils = ep_script_toggle_view_test_helper.utils;
      inner$ = helper.padInner$;

      var synopsis1 = smUtils.createSynopsis('first heading')
      var synopsis2 = smUtils.createSynopsis('second heading')
      var script = utils.action('action 1') +
        synopsis1 + utils.action('action 2') +
        synopsis2 + utils.action('action 3');

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
        var currentNumberOfElements = inner$('div').length;
        return currentNumberOfElements === initialNumberOfElements - 1;
      }).done(done);
    });

    it('selects the text of next visible element', function(done) {
      helper.waitFor(function() {
        var selectedText = inner$.document.getSelection().toString().replace('\n', '');
        return selectedText === 'FIRST HEADING';
      }).done(done);
    });

    context('when the user performs undo', function() {
      before(function() {
        utils.undo();
      });

      it('restores the deleted element', (done) => {
        helper.waitFor(function() {
          var currentNumberOfElements = inner$('div').length;
          return currentNumberOfElements === initialNumberOfElements;
        }).done(done);
      });
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
        var currentNumberOfElements = inner$('div').length;
        // it deletes the scene_name, the scene_summary and the heading
        return currentNumberOfElements === initialNumberOfElements - 3;
      }, 4000).done(done);
    });

    it('selects the text of next visible element', function(done) {
      helper.waitFor(function() {
        var selectedText = inner$.document.getSelection().toString().replace('\n', '');
        console.log(selectedText)
        return selectedText === 'action 2';
      }, 4000).done(done);
    });

    context('when the user performs undo', function() {
      before(function() {
        utils.undo();
      });

      it('restores the deleted element', (done) => {
        helper.waitFor(function() {
          var currentNumberOfElements = inner$('div').length;
          return currentNumberOfElements === initialNumberOfElements;
        }).done(done);
      });
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
        var currentNumberOfElements = inner$('div').length;
        return currentNumberOfElements < initialNumberOfElements;
      })
      .done(function() {
        expect().fail(function() { return 'scene mark should not be deleted' });
      })
      .fail(function() {
        done();
      });
    });
  });

  context('when the current line is the last line on document', () => {
    before(function(done) {
      this.timeout(4000);
      // the last line is not deleted, but its content is;
      // so we have to count the "action" elements, which
      // is the element being deleted here.
      initialNumberOfElements = inner$('action').length;
      utils.placeCaretInTheBeginningOfLine(lastActionLineNumber, function() {
        setTimeout(function() {
          apiUtils.simulateTriggerOfDeleteElement();
          done();
        }, 2000);
      })
    });

    it('deletes the current element', (done) => {
      helper.waitFor(function() {
        var currentNumberOfElements = inner$('action').length;
        return currentNumberOfElements === initialNumberOfElements - 1;
      }).done(done);
    });

    it('does not select any text', function(done) {
      helper.waitFor(function() {
        var selectedText = inner$.document.getSelection().toString();
        return selectedText === '';
      }).done(done);
    });

    context('when the user performs undo', function() {
      before(function() {
        utils.undo();
      });

      it('restores the deleted element', (done) => {
        helper.waitFor(function() {
          var currentNumberOfElements = inner$('action').length;
          return currentNumberOfElements === initialNumberOfElements;
        }).done(done);
      });
    });
  });

  // special case: https://trello.com/c/6blUwmJA/2514-reformat-pula-elementos
  context('when the user tries to change an empty line to another type', function() {
    var firstGeneral = 'general 1';
    var secondGeneral = 'general 2';
    var thirdGeneral = 'general 3';
    var headingLineNumber = 2;

    before(function(done) {
      this.timeout(6000);
      utils.cleanPad(function() {
        var synopsis1 = smUtils.createSynopsis('first heading')
        var general1 = utils.general(firstGeneral);
        var general2 = utils.general(secondGeneral);
        var general3 = utils.general(thirdGeneral);

        var script = synopsis1 + general1 + general2 + general3;
        utils.createScriptWith(script, thirdGeneral, function() {
          initialNumberOfElements = inner$('div').length;
          utils.placeCaretInTheBeginningOfLine(headingLineNumber, function() {
            setTimeout(function() {
              apiUtils.simulateTriggerOfDeleteElement();
              done();
            }, 2000);
          });
        });
      });
    });

    it('deletes the current element', (done) => {
      helper.waitFor(function() {
        var currentNumberOfElements = inner$('div').length;
        // it deletes the scene_name, the scene_summary and the heading
        return currentNumberOfElements === initialNumberOfElements - 3;
      }, 4000).done(done);
    });

    it('selects the text of next visible element', function(done) {
      helper.waitFor(function() {
        var selectedText = inner$.document.getSelection().toString().replace('\n', '');
        return selectedText === firstGeneral;
      }, 4000).done(done);
    });

    context('when the user performs undo', function() {
      before(function() {
        utils.undo();
      });

      it('restores the deleted element', (done) => {
        helper.waitFor(function() {
          var currentNumberOfElements = inner$('div').length;
          return currentNumberOfElements === initialNumberOfElements;
        }).done(done);
      });
    });
  });
});
