var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.utils = {
  _lineWithTag: function(tagName, text) {
    if (text === '') {
      return '<' + tagName + '><br/></' + tagName + '>';
    } else {
      return '<' + tagName + '>' + text + '</' + tagName + '><br/>';
    }
  },
  act: function(text) {
    return this.actName(text) + this.actSummary(text);
  },
  actName: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('act_name', text);
  },
  actSummary: function(text){
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('act_summary', text);
  },
  sequence: function (text) {
    return this.sequenceName(text) + this.sequenceSummary(text);
  },
  sequenceName: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('sequence_name', text);
  },
  sequenceSummary: function(text){
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('sequence_summary', text);
  },
  synopsis: function(text) {
    return this.sceneName(text) + this.sceneSummary(text);
  },
  sceneName: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('scene_name', text);
  },
  sceneSummary: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('scene_summary', text);
  },
  heading: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('heading', text);
  },
  action: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('action', text);
  },
  parenthetical: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('parenthetical', text);
  },
  character: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('character', text);
  },
  dialogue: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('dialogue', text);
  },
  shot: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('shot', text);
  },
  transition: function(text) {
    var self = ep_script_elements_test_helper.utils;
    return self._lineWithTag('transition', text);
  },
  general: function(text) {
    return text + "<br/>";
  },
  newPad: function(cb) {
    var self = this;
    var padId;
    var apiUtils = ep_script_elements_test_helper.apiUtils;
    padId = helper.newPad(function(){
      self._setEascScriptAsEnabled();
      apiUtils.startListeningToApiEvents();
      self._waitLoadSceneMarkPlugin(function(){
        cb(null, padId);
      });
    });
  },
  _waitLoadSceneMarkPlugin: function(cb) {
    helper.waitFor(function(){
      var pluginIsNotLoaded = (undefined === helper.padChrome$.window.clientVars.plugins.plugins.ep_script_scene_marks);
      return !pluginIsNotLoaded;
    }).done(cb);
  },
  _setEascScriptAsEnabled: function() {
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_script_elements;
    thisPlugin.isScriptActivated = true;
  },
  createScriptWith: function(scriptContent, lastLineText, cb) {
    var inner$ = helper.padInner$;
    var utils = ep_script_elements_test_helper.utils;
    this._setEascScriptAsEnabled();

    // set script content
    var $firstLine = inner$("div").first();
    $firstLine.html(scriptContent);

    // wait for Etherpad to finish processing the lines
    helper.waitFor(function(){
      var $lastLine = inner$("div").last();
      return utils.cleanText($lastLine.text()) === lastLineText;
    }, 2000).done(cb);
  },

  /**** vars and functions to change element type of a line: ****/
  GENERAL: 'general',
  HEADING: 'heading',
  ACTION: 'action',
  CHARACTER: 'character',
  PARENTHETICAL: 'parenthetical',
  DIALOGUE: 'dialogue',
  TRANSITION: 'transition',
  SHOT: 'shot',

  changeToElement: function(element, cb, lineNum){
    lineNum = lineNum || 0;
    var apiUtils = ep_script_elements_test_helper.apiUtils;
    var utils = ep_script_elements_test_helper.utils;

    var $line = helper.padInner$('div').eq(lineNum);
    helper.selectLines($line, $line);

    apiUtils.simulateTriggerOfDropdownChanged(element);

    if (element === utils.GENERAL) {
      cb();
    } else {
      // headings have synopsis created above them
      var targetLine = element === utils.HEADING ? lineNum + 2 : lineNum;
      helper.waitFor(function() {
        var $line = helper.padInner$('div').eq(targetLine);
        return $line.find(element).length === 1;
      }).done(cb);
    }
  },

  cleanText: function(text) {
    return text.replace(/\s/gi, " ");
  },

  buildStringWithLength: function(length, text) {
    return text.repeat(length);
  },

  buildScriptWithGenerals: function(text, howMany) {
    var utils = ep_script_page_view_test_helper.utils;

    var script = "";
    for (var i = 0; i < howMany; i++) {
      script += utils.general(text);
    }

    return script;
  },

  cleanPad: function(callback) {
    var inner$ = helper.padInner$;
    var $padContent = inner$("#innerdocbody");
    $padContent.html("");

    // wait for Etherpad to re-create first line
    helper.waitFor(function(){
      var lineNumber = inner$("div").length;
      return lineNumber === 1;
    }, 2000).done(callback);
  },

  getLineWhereCaretIs: function() {
    var inner$ = helper.padInner$;
    var nodeWhereCaretIs = inner$.document.getSelection().anchorNode;
    var $lineWhereCaretIs = $(nodeWhereCaretIs).closest("div");

    return $lineWhereCaretIs;
  },
  getColumnWhereCaretIs: function() {
    var inner$ = helper.padInner$;
    var columnWhereCaretIsOnElement = inner$.document.getSelection().anchorOffset;

    return columnWhereCaretIsOnElement;
  },
  getSelectedText: function() {
    var inner$ = helper.padInner$;
    var selectedText = inner$.document.getSelection().toString();

    return selectedText;
  },

  // first line === getLine(0)
  // second line === getLine(1)
  // ...
  getLine: function(lineNum) {
    var inner$ = helper.padInner$;
    var line = inner$("div").first();
    for (var i = lineNum - 1; i >= 0; i--) {
      line = line.next();
    }
    return line;
  },

  placeCaretOnLine: function(lineNum, cb) {
    ep_script_elements_test_helper.utils._moveCaretToLine(lineNum, '{selectall}', cb);
  },
  placeCaretInTheBeginningOfLine: function(lineNum, cb) {
    ep_script_elements_test_helper.utils._moveCaretToLine(lineNum, '{selectall}{leftarrow}', cb);
  },
  placeCaretAtTheEndOfLine: function(lineNum, cb) {
    ep_script_elements_test_helper.utils._moveCaretToLine(lineNum, '{selectall}{rightarrow}', cb);
  },
  placeCaretInTheMiddleOfLine: function(lineNum, cb) {
    ep_script_elements_test_helper.utils._moveCaretToLine(lineNum, '{selectall}{rightarrow}{leftarrow}', cb);
  },
  _moveCaretToLine: function(lineNum, sendkeysCommand, cb) {
    var self = ep_script_elements_test_helper.utils;
    var $targetLine = self.getLine(lineNum);
    $targetLine.sendkeys(sendkeysCommand);

    helper.waitFor(function() {
      var $targetLine = self.getLine(lineNum);
      var $lineWhereCaretIs = self.getLineWhereCaretIs();

      return $targetLine.get(0) === $lineWhereCaretIs.get(0);
    }).done(cb);
  },

  ENTER: 13,
  UNDO_REDO: 90,
  pressEnter: function() {
    this.pressKey(this.ENTER);
  },
  // try to type char 'a'
  typeChar: function() {
    var charA = 91;
    this.pressKey(charA, function(e) {
      e.which = "a".charCodeAt(0);
      e.type = 'keypress';
    });
  },
  pressKey: function(CODE, configEvent) {
    configEvent = configEvent || this.doNothing;

    var inner$ = helper.padInner$;
    var $editor = inner$('#innerdocbody');
    if(inner$(window)[0].bowser.firefox || inner$(window)[0].bowser.modernIE){ // if it's a mozilla or IE
      var evtType = 'keypress';
    }else{
      var evtType = 'keydown';
    }
    var e = inner$.Event(evtType);
    e.keyCode = CODE;

    // allow event to be prevented
    e.originalEvent = { preventDefault: function() { this.defaultPrevented = true }};
    e.originalEvent.defaultPrevented = false;

    configEvent(e);

    // trigger event on both instances of jQuery that plugins use
    helper.padChrome$($editor.get(0)).trigger(e);
    if (!e.originalEvent.defaultPrevented) {
      $editor.trigger(e);
    }
  },
  doNothing: function() {},
  buildUndoRedo: function(isRedo) {
    this.pressKey(this.UNDO_REDO, function(e) {
      e.ctrlKey = true;
      e.shiftKey = isRedo;
      e.which = "z".charCodeAt(0);
    });
  },
  undo: function() {
    ep_script_elements_test_helper.utils.buildUndoRedo(false);
  },
  redo: function() {
    ep_script_elements_test_helper.utils.buildUndoRedo(true);
  },
  validateLineTextAndType: function(lineNumber, expectedText, expectedType) {
    var $line = this.getLine(lineNumber);
    var actualText = this.cleanText($line.text());

    expect(actualText).to.be(expectedText);

    // use fail() to return a clearer failure message
    var actualType = this.getLineType(lineNumber);
    if (actualType !== expectedType) {
      var failureMessage = "Expected line '" + actualText + "' to be " + expectedType + ', found ' + actualType + ' instead';
      expect().fail(function() { return failureMessage });
    }
  },

  SCRIPT_ELEMENT_TYPE_SELECTOR: 'heading, action, character, dialogue, parenthetical, shot, transition',
  getLineType: function(lineNumber) {
    var SMUtils = ep_script_scene_marks_test_helper.utils;
    var sceneElementsAndSceneMarks = this.SCRIPT_ELEMENT_TYPE_SELECTOR + ',' + SMUtils.getAllSceneMarksTags();
    var $line = this.getLine(lineNumber);
    var $type = $line.find(sceneElementsAndSceneMarks).first();

    return $type.length !== 0 ? $type.get(0).tagName.toLowerCase() : this.GENERAL;
  },

  // first  - position = 0
  // second - position = 1
  getLineNumberOfElement: function(element, position){
    var inner$ = helper.padInner$;
    var $allDivs = inner$('div');
    var $element = inner$(element).eq(position);
    var $elementDiv = $element.closest('div').get(0);
    return _.indexOf($allDivs, $elementDiv);
  },
  changeElementType: function(element) {
    var seApiUtils = ep_script_elements_test_helper.apiUtils;
    seApiUtils.simulateTriggerOfDropdownChanged(element);
  },

  waitForCaretToBeOnLineWithType: function(element, done) {
    var apiUtils = ep_script_elements_test_helper.apiUtils;
    apiUtils.waitForApiToSend(element, done);
  },

  waitForAddingSceneLengthClasses: function(cb){
    var self = this;
    helper.waitFor(function(){
      var headingsClasses = self.getHeadingsSceneLengthClass();
      return headingsClasses.length && headingsClasses[0];
    }, 5000).done(cb);
  },

  getHeadingsSceneLengthClass: function() {
    var $headings = helper.padInner$('heading');
    return _.map($headings, function(heading){
      return Array.from(heading.classList).find(function(headingClass){
        return headingClass.startsWith('sceneLength-');
      });
    });
  },
};
