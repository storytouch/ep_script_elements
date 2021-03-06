describe('ep_script_elements - API - element type changed', function(){
  var utils, apiUtils, testHelper;
  var pressShortcutToOpenReformatWindow;
  var pressShortcutToCloseReformatWindow;
  var pressShortcutToChangeElementType;
  var CLOSE_REFORMAT_WINDOW_MESSAGE = 'close_reformat_window';
  var CHANGE_ELEMENT_TYPE_MESSAGE = 'change_element_type';
  var ACTIVATE_EASC_BUTTON_MESSAGE = 'activate_easc_button';
  var textOfSecondLine = 'line 2';

  before(function(cb){
    utils = ep_script_elements_test_helper.utils;
    apiUtils = ep_script_elements_test_helper.apiUtils;
    testHelper = ep_script_elements_test_helper.reformat;
    pressShortcutToOpenReformatWindow = testHelper.pressShortcutToOpenReformatWindow;
    pressShortcutToCloseReformatWindow = testHelper.pressShortcutToCloseReformatWindow;
    pressShortcutToChangeElementType = testHelper.pressShortcutToChangeElementType;
    utils.newPad(cb);
    this.timeout(60000);
  });

  context('when API receives a message that line was reformatted', function() {
    var $firstTextElement;

    before(function(done) {
      this.timeout(6000);

      var lastLineText = textOfSecondLine;
      var general1 = utils.general('line 1');
      var general2 = utils.general(textOfSecondLine);

      var script = general1 + general2;
      utils.createScriptWith(script, lastLineText, function() {
        // sets first line to action
        apiUtils.simulateTriggerOfChangeElementType(utils.ACTION);
        done();
      });
    });

    after(function(done) {
      utils.undo();
      utils.placeCaretInTheBeginningOfLine(0, done);
    });

    it('changes the line type', function(done) {
      helper.waitFor(function(){
        // wait for element to be processed and changed
        $firstTextElement = helper.padInner$('div').first(); // need to get it again because line is changed by Content Collector
        return $firstTextElement.find('action').length === 1;
      }, 4000).done(done);
    });

    // test text selection
    it('selects the text of next visible element', function(done) {
      helper.waitFor(function() {
        var selectedText = helper.padInner$.document.getSelection().toString();
        return selectedText === textOfSecondLine;
      }, 4000).done(done);
    });
  });

  context('when the user presses the shortcut to open the reformat window', function() {
    var OPEN_REFORMAT_WINDOW_MESSAGE = 'open_reformat_window';

    before(function(done) {
      apiUtils.resetLastDataSent();
      done();
    })

    it('sends a message to open the reformat window', function(done) {
      pressShortcutToOpenReformatWindow();
      apiUtils.waitForDataToBeSent(OPEN_REFORMAT_WINDOW_MESSAGE, done);
    });
  });

  context('when it receives a message that reformat window was opened', function() {
    before(function(done) {
      apiUtils.resetLastDataSent();
      apiUtils.simulateTriggerOfReformatWindowOpened();
      setTimeout(done, 500); // wait some time to process the request
    });

    after(function(cb) {
      apiUtils.simulateTriggerOfReformatWindowClosed();
      setTimeout(cb, 500); // wait some time to process the request
    });

    it('sends a message to activate script on easc', function(done) {
      apiUtils.waitForDataToBeSent(ACTIVATE_EASC_BUTTON_MESSAGE, done);
    });
  });

  context('when the user presses the shortcut to close the reformat window', function() {
    it('does not send a message to close the reformat window', function(done) {
      pressShortcutToCloseReformatWindow();
      apiUtils.waitForDataToNotBeSent(CLOSE_REFORMAT_WINDOW_MESSAGE, done);
    });

    context('when it receives a message that reformat window was opened', function() {
      before(function(done) {
        apiUtils.resetLastDataSent();
        apiUtils.simulateTriggerOfReformatWindowOpened();
        setTimeout(done, 500); // wait some time to process the request
      });

      after(function(cb) {
        apiUtils.simulateTriggerOfReformatWindowClosed();
        setTimeout(cb, 500); // wait some time to process the request
      });

      context('and the user presses the shortcut again', function() {
        it('sends a message to close the reformat window', function(done) {
          pressShortcutToCloseReformatWindow();
          apiUtils.waitForDataToBeSent(CLOSE_REFORMAT_WINDOW_MESSAGE, done);
        });
      });
    });
  });

  var changeElementTestsConfig = [
    {
      elementType: 'heading',
      shortcut: 49, // 1
      elementExists: function() { return helper.padInner$('heading').length === 1 },
    },
    {
      elementType: 'action',
      shortcut: 50, // 2
      elementExists: function() { return helper.padInner$('action').length === 1 },
    },
    {
      elementType: 'character',
      shortcut: 51, // 3
      elementExists: function() { return helper.padInner$('character').length === 1 },
    },
    {
      elementType: 'parenthetical',
      shortcut: 52, // 4
      elementExists: function() { return helper.padInner$('parenthetical').length === 1 },
    },
    {
      elementType: 'dialogue',
      shortcut: 53, // 5
      elementExists: function() { return helper.padInner$('dialogue').length === 1 },
    },
    {
      elementType: 'transition',
      shortcut: 54, // 6
      elementExists: function() { return helper.padInner$('transition').length === 1 },
    },
    {
      elementType: 'shot',
      shortcut: 55, // 7
      elementExists: function() { return helper.padInner$('shot').length === 1 },
    },
  ];

  changeElementTestsConfig.map(function(changeElementTest) {
    context(`when the user presses the shortcut to change the element type to ${changeElementTest.elementType}`, function() {
      it('does not change the type of element', function(done) {
        pressShortcutToChangeElementType(changeElementTest.shortcut);
        helper.waitFor(changeElementTest.elementExists, 1000)
          .done(function() {
            expect().fail(function() { return 'the type of element should not be changed' })
          })
          .fail(function() {
            done();
          });
      });

      context('when it receives a message that reformat window was opened', function() {
        before(function(done) {
          apiUtils.simulateTriggerOfReformatWindowOpened();
          setTimeout(done, 1000); // wait some time to process the request
        });

        after(function(done) {
          apiUtils.simulateTriggerOfReformatWindowClosed();
          utils.undo();
          utils.placeCaretInTheBeginningOfLine(0, done);
        });

        context('and the user presses the shortcut again', function() {
          it('changes the type of element', function(done) {
            pressShortcutToChangeElementType(changeElementTest.shortcut);
            helper.waitFor(changeElementTest.elementExists, 4000).done(done);
          });

          it('selects the text of next visible element', function(done) {
            helper.waitFor(function() {
              var selectedText = helper.padInner$.document.getSelection().toString();
              return selectedText === textOfSecondLine;
            }, 4000).done(done);
          });
        });
      });
    });
  });

  context('when the user presses the shortcut to change the element type to general', function() {
    before(function(done) {
      apiUtils.simulateTriggerOfReformatWindowOpened();
      setTimeout(done, 1000); // wait some time to process the request
    });

    after(function(done) {
      apiUtils.simulateTriggerOfReformatWindowClosed();
      setTimeout(done, 1000); // wait some time to process the request
    });

    it('does not change the element to another type', function(done) {
      pressShortcutToChangeElementType(48);
      helper.waitFor(function(){
        return helper.padInner$('span').length === 2;
      }, 4000).done(done);
    });
  });

  // special case: https://trello.com/c/k8Gs8fH8/1202
  context('when the user tries to change a heading to another type', function() {
    before(function(done) {
      this.timeout(6000);
      utils.cleanPad(function() {
        var sceneText = 'scene';
        var headingText = 'heading';
        var lastLineText = 'heading';
        var synopsis1 = utils.synopsis(sceneText);
        var synopsis2 = utils.synopsis(sceneText);
        var heading1 = utils.heading(headingText);
        var heading2 = utils.heading(lastLineText);

      // 1 scene name + 1 scene summary + 1 heading + 1 scene name + 1 scene summary + 1 heading
        var script = synopsis1 + heading1 + synopsis2 + heading2;
        utils.createScriptWith(script, lastLineText, function() {
          apiUtils.simulateTriggerOfReformatWindowOpened();
          setTimeout(function() {
            var digit0 = 48; // 48 is the code for digit 0, which is the shortcut for general
            pressShortcutToChangeElementType(digit0); // change to general
            done();
          }, 1000); // wait some time to process the request
        });
      });
    });

    after(function(done) {
      apiUtils.simulateTriggerOfReformatWindowClosed();
      setTimeout(done, 1000); // wait some time to process the request
    });

    it('removes the SM elements related to the removed heading', function(done) {
      // 1 general + 1 scene name + 1 scene summary + 1 heading
      var expectedNumberOfElements = 4;
      helper.waitFor(function(){
        return helper.padInner$('div').length === expectedNumberOfElements;
      }, 4000).done(done);
    })
  });

  // special case: https://trello.com/c/6blUwmJA/2514
  context('when the user tries to change an empty line to another type', function() {
    var firstLine = '';
    var secondLine = 'line 2';
    var thirdLine = 'line 3';

    before(function(done) {
      this.timeout(6000);
      utils.cleanPad(function() {
        var general1 = utils.general(firstLine); // empty line
        var general2 = utils.general(secondLine);
        var general3 = utils.general(thirdLine);

        var script = general1 + general2 + general3;
        utils.createScriptWith(script, thirdLine, function() {
          apiUtils.simulateTriggerOfReformatWindowOpened();
          setTimeout(function() {
            var digit1 = 49; // 49 is the code for digit 1, which is the shortcut for heading
            pressShortcutToChangeElementType(digit1); // change to heading
            done();
          }, 1000); // wait some time to process the request
        });
      });
    });

    after(function(done) {
      apiUtils.simulateTriggerOfReformatWindowClosed();
      setTimeout(done, 1000); // wait some time to process the request
    });

    it('changes the line type', function(done) {
      helper.waitFor(function(){
        return helper.padInner$('heading').length === 1;
      }, 4000).done(done);
    });

    // test text selection
    it('selects the text of next visible element', function(done) {
      helper.waitFor(function() {
        var selectedText = helper.padInner$.document.getSelection().toString().replace('\n', '');
        console.log(selectedText)
        return selectedText === secondLine;
      }, 4000).done(done);
    });
  });

  context.skip('when the user tries to type any key while reformatting', function() {
    it('does not process the key', function(done) {
      // we cannot simulate the event of a user pressing a key that should be blocked.
      // we are testing this feature on integration tests of teksto.
      done();
    })
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.reformat = {
  pressShortcutToOpenReformatWindow: function() {
    var openReformatWindowShortcut = 82; // R
    var isMac = ep_script_elements_test_helper.reformat.isMac();
    var shortcutInfo = isMac ? { ctrlKey: true, metaKey: true } : { ctrlKey: true, altKey: true }; // Cmd+Ctrl+R
    ep_script_elements_test_helper.reformat.buildShortcut(openReformatWindowShortcut, shortcutInfo);
  },
  pressShortcutToCloseReformatWindow: function() {
    var closeReformatWindowShortcut = 27; // ESC
    ep_script_elements_test_helper.reformat.buildShortcut(closeReformatWindowShortcut);
  },
  pressShortcutToChangeElementType: function(key) {
    ep_script_elements_test_helper.reformat.buildShortcut(key);
  },
  defaultShortcutInfo: {
    ctrlKey: false,
    altKey: false,
  },
  buildShortcut: function(keyCode, shortcutInfo) {
    var inner$ = helper.padInner$;
    if(inner$(window)[0].bowser.firefox || inner$(window)[0].bowser.modernIE){ // if it's a mozilla or IE
      var evtType = "keypress";
    }else{
      var evtType = "keydown";
    }
    var shortcutInfo = shortcutInfo || ep_script_elements_test_helper.reformat.defaultShortcutInfo;
    var e = inner$.Event(evtType);
    e.ctrlKey = shortcutInfo.ctrlKey;
    e.altKey = shortcutInfo.altKey;
    e.metaKey = shortcutInfo.metaKey;
    e.keyCode = keyCode;
    inner$("#innerdocbody").trigger(e);
  },
  isMac: function() {
    var inner$ = helper.padInner$;
    var isMac = inner$(window)[0].bowser.mac ? true : false
    return isMac;
  },
}
