var utils = require('./utils');
var api = require('./api');
var shared = require('./shared');

var OPEN_REFORMAT_WINDOW_MESSAGE = 'open_reformat_window';
var CLOSE_REFORMAT_WINDOW_MESSAGE = 'close_reformat_window';

var reformatShortcutHandler = function(ace) {
  this.ace = ace;
  this.plugin = utils.getThisPluginProps();
}

reformatShortcutHandler.prototype.handleChangeElementType = function(newElementType, context) {
  var self = this;
  var editorInfo = context.editorInfo;
  var currentLine = editorInfo.ace_caretLine();
  this.ace.callWithAce(function(innerAce) {
    innerAce.ace_inCallStackIfNecessary(utils.CHANGE_ELEMENT_EVENT, function() {
      innerAce.ace_doInsertScriptElement(newElementType);
      self.plugin.elementContentSelector.selectNextElement();
    });
  });
  if (context.callstack) {
    context.callstack.editEvent.eventType = shared.SCRIPT_ELEMENT_REMOVED;
    context.callstack.editEvent.data = { lineNumbers: [currentLine] };
  }
  return true;
}

reformatShortcutHandler.prototype.handleSelectNextElement = function() {
  this.plugin.elementContentSelector.selectNextElement();
  /*
   * [1] by returning true, we tell the shortcutsAndMergeLinesHandler that
   * the pressed key MUST be canceled (preventDefault). Otherwise, the default
   * behavior of that key will take effect.
   */
  return true;
}

reformatShortcutHandler.prototype.handleSelectPreviousElement = function() {
  this.plugin.elementContentSelector.selectPreviousElement();
  return true; // [1]
}

reformatShortcutHandler.prototype.handleDeleteElement = function() {
  var lineToSelect = this.plugin.elementContentCleaner.deleteElement();
  this.plugin.elementContentSelector.selectElement(lineToSelect);
  return true; // [1]
}

reformatShortcutHandler.prototype.handleOpenReformatWindow = function() {
  api.triggerEvent({ type: OPEN_REFORMAT_WINDOW_MESSAGE });
  return true; // [1]
}

reformatShortcutHandler.prototype.handleCloseReformatWindow = function() {
  api.triggerEvent({ type: CLOSE_REFORMAT_WINDOW_MESSAGE });
  return true; // [1]
}

exports.init = function(ace) {
  return new reformatShortcutHandler(ace);
}
