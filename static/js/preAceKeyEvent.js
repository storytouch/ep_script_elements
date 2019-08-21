// fill some info on context.evt -- to be used on this and other plugins
var utils = require('./utils');

var DELETE = 46;
var BACKSPACE = 8;
var CTRL_H = 72; // another way of pressing BACKSPACE

exports.aceKeyEvent = function(hook, context) {
  var editorInfo       = context.editorInfo;
  var rep              = context.rep;
  var attributeManager = context.documentAttributeManager;
  var evt              = context.evt;
  var keyCode          = evt.keyCode;

  // set some values on context.evt, so they can be used on other plugins too
  evt.isBackspace = keyCode === BACKSPACE || keyCode === CTRL_H;
  evt.isDelete = keyCode === DELETE;
  // check key pressed before anything else to be more efficient
  evt.isRemoveKey = (evt.isDelete || evt.isBackspace) && evt.type === 'keydown';

  // add some more info that will be used on line merging scenarios
  if (evt.isRemoveKey) {
    synchronizeEditorWithUserSelection(editorInfo);

    // HACK: we need to get current position after calling synchronizeEditorWithUserSelection(),
    // otherwise some tests might fail -- here on other plugins
    evt.caretPosition = getCaretPosition(rep, editorInfo, attributeManager);
    evt.atFirstLineOfPad = currentLineIsFirstLineOfPad(rep);
    evt.atLastLineOfPad = currentLineIsLastLineOfPad(rep);
  }
}

var getCaretPosition = function(rep, editorInfo, attributeManager) {
  var line = rep.selStart[0];
  var lineLength = utils.getLength(line, rep);
  var caretPosition = editorInfo.ace_caretColumn();
  var lineHasMarker = attributeManager.lineHasMarker(line);
  var firstPostionOfLine = lineHasMarker ? 1 : 0;

  var atBeginningOfLine = (caretPosition === firstPostionOfLine);
  var atEndOfLine = (caretPosition === lineLength);

  return {
    beginningOfLine: atBeginningOfLine,
    middleOfLine: (!atBeginningOfLine && !atEndOfLine),
    endOfLine: atEndOfLine,
  }
}

var synchronizeEditorWithUserSelection = function(editorInfo) {
  editorInfo.ace_fastIncorp();
}

var currentLineIsFirstLineOfPad = function(rep) {
  var currentLine = rep.selStart[0];
  return currentLine === 0;
}

var currentLineIsLastLineOfPad = function(rep) {
  var totalLinesOfPad = rep.lines.length();
  var currentLine = rep.selStart[0] + 1; // 1st line is 0, so we need to increase 1 to the value

  return currentLine === totalLinesOfPad;
}
