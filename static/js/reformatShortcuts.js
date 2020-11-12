var utils = require('./utils');
var api   = require('./api');

var OPEN_REFORMAT_WINDOW    = 82; // R
var CLOSE_REFORMAT_WINDOW   = 27; // Esc
var CHANGE_TO_GENERAL       = [48, 96]; // Digit0 and Numpad0
var CHANGE_TO_HEADING       = [49, 97]; // Digit1 and Numpad1
var CHANGE_TO_ACTION        = [50, 98]; // Digit2 and Numpad2
var CHANGE_TO_CHARACTER     = [51, 99]; // Digit3 and Numpad3
var CHANGE_TO_PARENTHETICAL = [52, 100]; // Digit4 and Numpad4
var CHANGE_TO_DIALOGUE      = [53, 101]; // Digit5 and Numpad5
var CHANGE_TO_TRANSITION    = [54, 102]; // Digit6 and Numpad6
var CHANGE_TO_SHOT          = [55, 103]; // Digit7 and Numpad7
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
   * NOTE #1: by returning false, we tell the shortcutsAndMergeLinesHandler that
   * this function does NOT interrupt the key handling, as the action is always valid.
   * See "mergeLines" for an example where the execution must be interrupted.
   */
  return false;
};

SHORTCUT_HANDLERS[CLOSE_REFORMAT_WINDOW] = function() {
  api.triggerEvent({ type: CLOSE_REFORMAT_WINDOW_MESSAGE });
  // see NOTE #1
  return false;
};

SHORTCUT_HANDLERS[SELECT_NEXT_ELEMENT] = function() {
  triggerReformatEvent({ type: SELECT_NEXT_ELEMENT_MESSAGE });
  // see NOTE #1
  return false;
}

SHORTCUT_HANDLERS[SELECT_PREVIOUS_ELEMENT] = function() {
  triggerReformatEvent({ type: SELECT_PREVIOUS_ELEMENT_MESSAGE });
  // see NOTE #1
  return false;
}

SHORTCUT_HANDLERS[DELETE_ELEMENT] = function() {
  triggerReformatEvent({ type: DELETE_ELEMENT_MESSAGE });
  // see NOTE #1
  return false;
}

var createFunctionToChangeElementType = function(newElementType) {
  return function() {
    triggerReformatEvent({ type: CHANGE_ELEMENT_TYPE_MESSAGE, element: newElementType });
    // see NOTE #1
    return false;
  }
}

// general
SHORTCUT_HANDLERS[CHANGE_TO_GENERAL[0]] = createFunctionToChangeElementType('general');
SHORTCUT_HANDLERS[CHANGE_TO_GENERAL[1]] = createFunctionToChangeElementType('general');
// heading
SHORTCUT_HANDLERS[CHANGE_TO_HEADING[0]] = createFunctionToChangeElementType('heading');
SHORTCUT_HANDLERS[CHANGE_TO_HEADING[1]] = createFunctionToChangeElementType('heading');
// action
SHORTCUT_HANDLERS[CHANGE_TO_ACTION[0]] = createFunctionToChangeElementType('action');
SHORTCUT_HANDLERS[CHANGE_TO_ACTION[1]] = createFunctionToChangeElementType('action');
// character
SHORTCUT_HANDLERS[CHANGE_TO_CHARACTER[0]] = createFunctionToChangeElementType('character');
SHORTCUT_HANDLERS[CHANGE_TO_CHARACTER[1]] = createFunctionToChangeElementType('character');
// parenthetical
SHORTCUT_HANDLERS[CHANGE_TO_PARENTHETICAL[0]] = createFunctionToChangeElementType('parenthetical');
SHORTCUT_HANDLERS[CHANGE_TO_PARENTHETICAL[1]] = createFunctionToChangeElementType('parenthetical');
// dialogue
SHORTCUT_HANDLERS[CHANGE_TO_DIALOGUE[0]] = createFunctionToChangeElementType('dialogue');
SHORTCUT_HANDLERS[CHANGE_TO_DIALOGUE[1]] = createFunctionToChangeElementType('dialogue');
// transition
SHORTCUT_HANDLERS[CHANGE_TO_TRANSITION[0]] = createFunctionToChangeElementType('transition');
SHORTCUT_HANDLERS[CHANGE_TO_TRANSITION[1]] = createFunctionToChangeElementType('transition');
// shot
SHORTCUT_HANDLERS[CHANGE_TO_SHOT[0]] = createFunctionToChangeElementType('shot');
SHORTCUT_HANDLERS[CHANGE_TO_SHOT[1]] = createFunctionToChangeElementType('shot');

exports.findHandlerFor = function(context) {
  var evt = context.evt;
  var type = evt.type;
  var reformatWindowState = utils.getThisPluginProps().reformatWindowState;
  var isTypeForCmdKey = ((browser.msie || browser.safari || browser.chrome) ? (type == "keydown") : (type == "keypress"));

  if (!isTypeForCmdKey) return undefined;

  if (reformatWindowState.isOpened()) {
    return SHORTCUT_HANDLERS[evt.keyCode];
  } else {
    // Cmd+Ctrl (mac) or Ctrl+Alt (windows)
    if ((evt.metaKey && evt.ctrlKey) || (evt.ctrlKey && evt.altKey)) {
      return SHORTCUT_HANDLERS[evt.keyCode];
    }
  }
  return undefined;
}
