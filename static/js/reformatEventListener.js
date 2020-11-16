var utils = require('./utils');
var changeElementOnDropdownChange = require('./changeElementOnDropdownChange');

var HANDLE_SHORTCUT_EVENT   = 'handle_shortcut_event';
var CHANGE_ELEMENT_TYPE     = 'change_element_type';
var SELECT_NEXT_ELEMENT     = 'select_next_element';
var SELECT_PREVIOUS_ELEMENT = 'select_previous_element';
var DELETE_ELEMENT          = 'delete_element';

var reformatEventListener = function(ace) {
  this.ace = ace;
  var self = this;

  var $innerDoc = utils.getPadInner().find('#innerdocbody');
  $innerDoc.on(HANDLE_SHORTCUT_EVENT, function(e, data) {
    self._handleCall(data);
  });
}

reformatEventListener.prototype._handleCall = function(data) {
  var type = data.type;
  switch (type) {
    case CHANGE_ELEMENT_TYPE: {
      var thisPlugin = utils.getThisPluginProps();
      var self = this;
      this.ace.callWithAce(function(innerAce) {
        innerAce.ace_inCallStackIfNecessary('change_element_type', function() {
          innerAce.ace_doInsertScriptElement(data.element);
          thisPlugin.elementContentSelector.selectNextElement();
        });
      });
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
    default: return;
  }
}

exports.init = function(ace) {
  return new reformatEventListener(ace);
}
