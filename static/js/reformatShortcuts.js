var utils = require('./utils');
var api   = require('./api');

var OPEN_REFORMAT_WINDOW    = 82; // R
var CLOSE_REFORMAT_WINDOW   = 27; // Esc
var CHANGE_TO_GENERAL       = 48; // Digit0
var CHANGE_TO_HEADING       = 49; // Digit1
var CHANGE_TO_ACTION        = 50; // Digit2
var CHANGE_TO_CHARACTER     = 51; // Digit3
var CHANGE_TO_PARENTHETICAL = 52; // Digit4
var CHANGE_TO_DIALOGUE      = 53; // Digit5
var CHANGE_TO_TRANSITION    = 54; // Digit6
var CHANGE_TO_SHOT          = 55; // Digit7
var SELECT_NEXT_ELEMENT     = 39; // ArrowRight
var SELECT_PREVIOUS_ELEMENT = 37; // ArrowLeft
var DELETE_ELEMENT          = 46; // Del

var macKeyMappings = {
  8: DELETE_ELEMENT, // BACKSPACE = DELETE_ELEMENT
};

var SHORTCUT_HANDLERS = {};

// NOTE: the functions below receive the "context" object as an argument.

SHORTCUT_HANDLERS[OPEN_REFORMAT_WINDOW] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleOpenReformatWindow();
}
SHORTCUT_HANDLERS[CLOSE_REFORMAT_WINDOW] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleCloseReformatWindow();
}
SHORTCUT_HANDLERS[SELECT_NEXT_ELEMENT] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleSelectNextElement();
}
SHORTCUT_HANDLERS[SELECT_PREVIOUS_ELEMENT] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleSelectPreviousElement();
}
SHORTCUT_HANDLERS[DELETE_ELEMENT] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleDeleteElement();
}

var convertNumpadToDigitIfNecessary = function(keyCode) {
  var isNumpad = (keyCode >= 96 && keyCode <= 103) // 0 -7 (Numpad keys)
  // does not return the numpad key but its number key relative
  return isNumpad ? keyCode - 48 : keyCode;
}

var createFunctionToChangeElementType = function(newElementType) {
  return function(context) {
    var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
    return reformatShortcutHandler.handleChangeElementType(newElementType, context);
  }
}

SHORTCUT_HANDLERS[CHANGE_TO_GENERAL]       = createFunctionToChangeElementType('general');
SHORTCUT_HANDLERS[CHANGE_TO_HEADING]       = createFunctionToChangeElementType('heading');
SHORTCUT_HANDLERS[CHANGE_TO_ACTION]        = createFunctionToChangeElementType('action');
SHORTCUT_HANDLERS[CHANGE_TO_CHARACTER]     = createFunctionToChangeElementType('character');
SHORTCUT_HANDLERS[CHANGE_TO_PARENTHETICAL] = createFunctionToChangeElementType('parenthetical');
SHORTCUT_HANDLERS[CHANGE_TO_DIALOGUE]      = createFunctionToChangeElementType('dialogue');
SHORTCUT_HANDLERS[CHANGE_TO_TRANSITION]    = createFunctionToChangeElementType('transition');
SHORTCUT_HANDLERS[CHANGE_TO_SHOT]          = createFunctionToChangeElementType('shot');

exports.findHandlerFor = function(context) {
  var evt = context.evt;
  var type = evt.type;
  var reformatWindowState = utils.getThisPluginProps().reformatWindowState;
  var isTypeForCmdKey = ((browser.msie || browser.safari || browser.chrome) ? (type == "keydown") : (type == "keypress"));

  if (!isTypeForCmdKey) return undefined;

  if (reformatWindowState.isOpened()) {
    var isMac = browser.mac;
    var keyCode = convertNumpadToDigitIfNecessary(evt.keyCode);

    if (isMac) { keyCode = macKeyMappings[keyCode]; }

    return SHORTCUT_HANDLERS[keyCode];
  } else {
    // Cmd+Ctrl (mac) or Ctrl+Alt (windows)
    var isCmdCtrlPressed = (evt.metaKey && evt.ctrlKey) || (evt.ctrlKey && evt.altKey);

    // check if "R" key is pressed
    var isShortcutToOpenReformatWindow = evt.keyCode === OPEN_REFORMAT_WINDOW;

    // if "Cmd+Ctrl" are pressed, we must check if the key "R" is also pressed.
    // this avoids returning the openReformatWindow handler for the "Cmd+Ctrl+2"
    // (add scene) shortcut, for example.
    if (isCmdCtrlPressed && isShortcutToOpenReformatWindow) {
      return SHORTCUT_HANDLERS[evt.keyCode];
    }
  }
  return undefined;
}
