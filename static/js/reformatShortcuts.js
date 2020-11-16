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

var OPEN_REFORMAT_WINDOW_MESSAGE = 'open_reformat_window';
var CLOSE_REFORMAT_WINDOW_MESSAGE = 'close_reformat_window';
var CHANGE_ELEMENT_TYPE_MESSAGE = 'change_element_type';
var SELECT_NEXT_ELEMENT_MESSAGE = 'select_next_element';
var SELECT_PREVIOUS_ELEMENT_MESSAGE = 'select_previous_element';
var DELETE_ELEMENT_MESSAGE = 'delete_element';
var HANDLE_SHORTCUT_EVENT = 'handle_shortcut_event';

// send message to reformatEventListener
var triggerReformatEvent = function(data) {
  var $innerDoc = utils.getPadInner().find('#innerdocbody');
  $innerDoc.trigger(HANDLE_SHORTCUT_EVENT, data);
}

var SHORTCUT_HANDLERS = {};

SHORTCUT_HANDLERS[OPEN_REFORMAT_WINDOW] = function() {
  api.triggerEvent({ type: OPEN_REFORMAT_WINDOW_MESSAGE });
  /*
   * [1] by returning false, we tell the shortcutsAndMergeLinesHandler that
   * this function does NOT interrupt the key handling, as the action is always valid.
   * See "mergeLines" for an example where the execution must be interrupted.
   */
  return false;
};

SHORTCUT_HANDLERS[CLOSE_REFORMAT_WINDOW] = function() {
  api.triggerEvent({ type: CLOSE_REFORMAT_WINDOW_MESSAGE });
  return false; // [1]
};

SHORTCUT_HANDLERS[SELECT_NEXT_ELEMENT] = function() {
  triggerReformatEvent({ type: SELECT_NEXT_ELEMENT_MESSAGE });
  return false; // [1]
}

SHORTCUT_HANDLERS[SELECT_PREVIOUS_ELEMENT] = function() {
  triggerReformatEvent({ type: SELECT_PREVIOUS_ELEMENT_MESSAGE });
  return false; // [1]
}

SHORTCUT_HANDLERS[DELETE_ELEMENT] = function() {
  triggerReformatEvent({ type: DELETE_ELEMENT_MESSAGE });
  return false; // [1]
}

var convertNumpadToDigitIfNecessary = function(keyCode) {
  var isNumpad = (keyCode >= 96 && keyCode <= 103) // 0 -7 (Numpad keys)
  // does not return the numpad key but its number key relative
  return isNumpad ? keyCode - 48 : keyCode;
}

var createFunctionToChangeElementType = function(newElementType) {
  return function() {
    triggerReformatEvent({ type: CHANGE_ELEMENT_TYPE_MESSAGE, element: newElementType });
    return false; // [1]
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
    var keyCode = convertNumpadToDigitIfNecessary(evt.keyCode);
    return SHORTCUT_HANDLERS[keyCode];
  } else {
    // Cmd+Ctrl (mac) or Ctrl+Alt (windows)
    if ((evt.metaKey && evt.ctrlKey) || (evt.ctrlKey && evt.altKey)) {
      return SHORTCUT_HANDLERS[evt.keyCode];
    }
  }
  return undefined;
}
