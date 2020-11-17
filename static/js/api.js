var changeElementOnDropdownChange = require('./changeElementOnDropdownChange');
var formattingStyleOfSelection    = require('./formattingStyleOfSelection');
var sceneDuration                 = require('./sceneDuration');
var utils                         = require('./utils');

var CHANGE_CARET_ELEMENT_MESSAGE_TYPE = 'dropdown_caret_element_changed';
var CHANGE_SM_SET_MESSAGE_TYPE        = 'scene_mark_set_element_changed';
var DROPDOWN_ELEMENT_CHANGED          = 'dropdown_element_changed';
var FORMATTING_BUTTON_PRESSED         = 'formatting_button_pressed';
var UPDATE_SCENE_DURATION             = 'UPDATE_SCENE_DURATION';
var CHANGE_ELEMENT_TYPE               = 'change_element_type';
var SELECT_NEXT_ELEMENT               = 'select_next_element';
var SELECT_PREVIOUS_ELEMENT           = 'select_previous_element';
var DELETE_ELEMENT                    = 'delete_element';
var REFORMAT_WINDOW_CLOSED            = 'reformat_window_closed';
var REFORMAT_WINDOW_OPENED            = 'reformat_window_opened';

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
  triggerEvent(message);
}

exports.triggerSMSetElementChanged = function(elementType) {
  var message = {
    type: CHANGE_SM_SET_MESSAGE_TYPE,
    elementType: elementType,
  };
  triggerEvent(message);
}

var triggerEvent = function triggerEvent(message) {
  // if there's a wrapper to Etherpad, send data to it; otherwise use Etherpad own window
  var target = window.parent ? window.parent : window;
  target.postMessage(message, '*');
}
exports.triggerEvent = triggerEvent;

var _handleOutboundCalls = function _handleOutboundCalls(e, ace) {
  var type = e.data.type;
  switch (type) {
    case DROPDOWN_ELEMENT_CHANGED: {
      changeElementOnDropdownChange.updateElementOfSelection(ace, e.data.element);
      break;
    }
    case UPDATE_SCENE_DURATION: {
      var duration = e.data.duration;
      var lineId = e.data.scene.lineId;
      sceneDuration.setSceneDuration(ace, lineId, duration);
      break;
    }
    case FORMATTING_BUTTON_PRESSED: {
      formattingStyleOfSelection.clickButton(e.data.buttonName);
      break;
    }
    case CHANGE_ELEMENT_TYPE: {
      var thisPlugin = utils.getThisPluginProps();
      changeElementOnDropdownChange.updateElementOfSelection(ace, e.data.element);
      thisPlugin.elementContentSelector.selectNextElement();
      break;
    }
    case SELECT_NEXT_ELEMENT: {
      var thisPlugin = utils.getThisPluginProps();
      thisPlugin.elementContentSelector.selectNextElement();
      break;
    }
    case SELECT_PREVIOUS_ELEMENT: {
      var thisPlugin = utils.getThisPluginProps();
      thisPlugin.elementContentSelector.selectPreviousElement();
      break;
    }
    case DELETE_ELEMENT: {
      var thisPlugin = utils.getThisPluginProps();
      var lineToSelect = thisPlugin.elementContentCleaner.deleteElement();
      thisPlugin.elementContentSelector.selectElement(lineToSelect);
      break;
    }
    case REFORMAT_WINDOW_OPENED: {
      var thisPlugin = utils.getThisPluginProps();
      thisPlugin.reformatWindowState.setToOpened();
      thisPlugin.elementContentSelector.selectCurrentElement();
      break;
    }
    case REFORMAT_WINDOW_CLOSED: {
      var thisPlugin = utils.getThisPluginProps();
      thisPlugin.reformatWindowState.setToClosed();
      break;
    }
    default: {
      return;
    }
  }
}
