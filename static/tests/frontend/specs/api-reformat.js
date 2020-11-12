describe('ep_script_elements - API - element type changed', function(){
  var utils, apiUtils, testHelper;
  var pressShortcutToOpenReformatWindow;
  var pressShortcutToCloseReformatWindow;
  var pressShortcutToChangeElementType;
  var CLOSE_REFORMAT_WINDOW_MESSAGE = 'close_reformat_window';
  var CHANGE_ELEMENT_TYPE_MESSAGE = 'change_element_type';

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

  beforeEach(function() {
    apiUtils.resetLastDataSent();
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
    });

    after(function(done) {
      utils.undo();
      utils.placeCaretInTheBeginningOfLine(0, done);
    });

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
  });

  context('when the user presses the shortcut to open the reformat window', function() {
    var OPEN_REFORMAT_WINDOW_MESSAGE = 'open_reformat_window';

    it('sends a message to open the reformat window', function(done) {
      pressShortcutToOpenReformatWindow();
      apiUtils.waitForDataToBeSent(OPEN_REFORMAT_WINDOW_MESSAGE, done);
    });
  });

  context('when the user presses the shortcut to close the reformat window', function() {
    it('does not send a message to close the reformat window', function(done) {
      pressShortcutToCloseReformatWindow();
      apiUtils.waitForDataToNotBeSent(CLOSE_REFORMAT_WINDOW_MESSAGE, done);
    });

    context('when it receives a message that reformat window was opened', function() {
      before(function(done) {
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
        });
      });
    });
  });

  context('when the user presses the shortcut to change the element type to general', function() {
    it('does not change the element to another type', function(done) {
      pressShortcutToChangeElementType(48);
      helper.waitFor(function(){
        return helper.padInner$('span').length === 2;
      }, 4000).done(done);
    });
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
