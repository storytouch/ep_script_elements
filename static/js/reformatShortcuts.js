var _ = require('ep_etherpad-lite/static/js/underscore');
var utils = require('./utils');
var api   = require('./api');

var KEYS = {
  R: 82,
  Z: 90,
  ESC: 27,
  DIGIT0: 48,
  DIGIT1: 49,
  DIGIT2: 50,
  DIGIT3: 51,
  DIGIT4: 52,
  DIGIT5: 53,
  DIGIT6: 54,
  DIGIT7: 55,
  ARROW_UP: 38,
  ARROW_DOWN: 40,
  DELETE: 46,
  BACKSPACE: 8,
}

var OPEN_REFORMAT_WINDOW    = KEYS.R;
var CLOSE_REFORMAT_WINDOW   = KEYS.ESC;
var CHANGE_TO_GENERAL       = KEYS.DIGIT0;
var CHANGE_TO_HEADING       = KEYS.DIGIT1;
var CHANGE_TO_ACTION        = KEYS.DIGIT2;
var CHANGE_TO_CHARACTER     = KEYS.DIGIT3;
var CHANGE_TO_PARENTHETICAL = KEYS.DIGIT4;
var CHANGE_TO_DIALOGUE      = KEYS.DIGIT5;
var CHANGE_TO_TRANSITION    = KEYS.DIGIT6;
var CHANGE_TO_SHOT          = KEYS.DIGIT7;
var SELECT_NEXT_ELEMENT     = KEYS.ARROW_DOWN;
var SELECT_PREVIOUS_ELEMENT = KEYS.ARROW_UP;
var DELETE_ELEMENT          = KEYS.DELETE;
var UNDO                    = KEYS.Z;

var MAC_SHORTCUTS_TRANSLATOR = {
  [KEYS.BACKSPACE]: KEYS.DELETE,
};

var SHORTCUT_HANDLERS = {};

// NOTE: the functions below receive the "context" object as an argument.

SHORTCUT_HANDLERS[OPEN_REFORMAT_WINDOW] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleOpenReformatWindow();
};
SHORTCUT_HANDLERS[CLOSE_REFORMAT_WINDOW] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleCloseReformatWindow();
};
SHORTCUT_HANDLERS[SELECT_NEXT_ELEMENT] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleSelectNextElement();
};
SHORTCUT_HANDLERS[SELECT_PREVIOUS_ELEMENT] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleSelectPreviousElement();
};
SHORTCUT_HANDLERS[DELETE_ELEMENT] = function() {
  var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
  return reformatShortcutHandler.handleDeleteElement();
};
// for UNDO, we define a function that does nothing but does return "false",
// so that the event is not prevented.
SHORTCUT_HANDLERS[UNDO] = function() { return false; };

var convertNumpadToDigitIfNecessary = function(keyCode) {
  var isNumpad = (keyCode >= 96 && keyCode <= 103) // 0 to 7 (Numpad keys)
  // does not return the numpad key but its number key relative
  return isNumpad ? keyCode - 48 : keyCode;
};

var getRelatedKeyOnMac = function(keyCode) {
  return MAC_SHORTCUTS_TRANSLATOR[keyCode] || keyCode;
}

var createFunctionToChangeElementType = function(newElementType) {
  return function(context) {
    var reformatShortcutHandler = utils.getThisPluginProps().reformatShortcutHandler;
    return reformatShortcutHandler.handleChangeElementType(newElementType, context);
  }
};

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
    var keyCode = convertNumpadToDigitIfNecessary(evt.keyCode);
    var isMac = browser.mac;
    keyCode = isMac ? getRelatedKeyOnMac(keyCode) : keyCode;

    if (keyCode === KEYS.Z) {
      if (evt.metaKey || evt.ctrlKey) {
        return SHORTCUT_HANDLERS[keyCode];
      }
      return undefined;
    }

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
