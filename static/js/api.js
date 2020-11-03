var changeElementOnDropdownChange = require('./changeElementOnDropdownChange');
var formattingStyleOfSelection    = require('./formattingStyleOfSelection');
var sceneDuration                 = require('./sceneDuration');
var elementContentSelector        = require('./elementContentSelector');

var CHANGE_CARET_ELEMENT_MESSAGE_TYPE = 'dropdown_caret_element_changed';
var CHANGE_SM_SET_MESSAGE_TYPE        = 'scene_mark_set_element_changed';
var DROPDOWN_ELEMENT_CHANGED          = 'dropdown_element_changed';
var FORMATTING_BUTTON_PRESSED         = 'formatting_button_pressed';
var UPDATE_SCENE_DURATION             = 'UPDATE_SCENE_DURATION';

exports.init = function(ace) {
  // listen to outbound calls of this API
  window.addEventListener('message', function(e) {
    _handleOutboundCalls(e, ace);
  });
}

exports.triggerCaretElementChanged = function(elementType) {
  var message = {
    type: CHANGE_CARET_ELEMENT_MESSAGE_TYPE,
    elementType: elementType,
  };
  _triggerEvent(message);
}

exports.triggerSMSetElementChanged = function(elementType) {
  var message = {
    type: CHANGE_SM_SET_MESSAGE_TYPE,
    elementType: elementType,
  };
  _triggerEvent(message);
}

var _triggerEvent = function _triggerEvent(message) {
  // if there's a wrapper to Etherpad, send data to it; otherwise use Etherpad own window
  var target = window.parent ? window.parent : window;
  target.postMessage(message, '*');
}

var _handleOutboundCalls = function _handleOutboundCalls(e, ace) {
  var type = e.data.type;
  if (type === DROPDOWN_ELEMENT_CHANGED) {
    changeElementOnDropdownChange.updateElementOfSelection(ace, e.data.element);
    elementContentSelector.selectNextElement(ace);
  } else if (type === FORMATTING_BUTTON_PRESSED) {
    formattingStyleOfSelection.clickButton(e.data.buttonName);
  } else if (type === UPDATE_SCENE_DURATION) {
    var duration = e.data.duration;
    var lineId = e.data.scene.lineId;
    sceneDuration.setSceneDuration(ace, lineId, duration);
  }
}
