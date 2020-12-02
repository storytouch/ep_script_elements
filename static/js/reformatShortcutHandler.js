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
  var attributeManager = context.documentAttributeManager;

  var currentLine = editorInfo.ace_caretLine();
  var lineType = utils.getLineType(currentLine, attributeManager);

  if (lineType === 'heading' || newElementType === 'heading') {
    this._handleChangeWithHeading(currentLine, newElementType, context);
  } else {
    this._handleChangeWithoutHeading(newElementType);
  }

  return true;
}

reformatShortcutHandler.prototype._handleChangeWithHeading = function(currentLine, newElementType, context) {
  var self = this;
  this.ace.callWithAce(function(innerAce) {
    innerAce.ace_inCallStackIfNecessary(utils.CHANGE_ELEMENT_EVENT, function() {
      /*
       * when the element changing involves a heading, we have to follow
       * some steps:
       *   [1] - change the element type
       *   [2] - synchronize the rep with the new lines
       *   [3] - select the next element
       */

      // [1] simply change the element from heading to another type,
      // or vice versa
      innerAce.ace_doInsertScriptElement(newElementType);

      // [2] before get the line number from rep we have to update it,
      // otherwise it will keep the values outdated. This is necessary
      // to select the content of the next line.
      innerAce.ace_fastIncorp();

      // [3] this step involes two scenarios:
      //   [3.1] while changing from script element to heading: at this moment,
      //   the document doesn't have yet the new lines (title and summary).
      //   So we can set the next line to currentLine + 1.
      //
      //   [3.2] while changing from heading to script element: at this moment,
      //   the document still have the scene mark lines, but those lines are
      //   above the line we want to select. So we can calculate the next line
      //   the same way we do in [3.1].
      var nextLine = currentLine + 1;
      self.plugin.elementContentSelector.selectElement(nextLine);
    });
  });

  // Reflect the element removal on the edit event associated with this change,
  // so that other plugins know that this change happened
  if (context.callstack) {
    context.callstack.editEvent.eventType = shared.SCRIPT_ELEMENT_REMOVED;
    context.callstack.editEvent.data = { lineNumbers: [currentLine] };
  }
}

reformatShortcutHandler.prototype._handleChangeWithoutHeading = function(newElementType) {
  var self = this;
  this.ace.callWithAce(function(innerAce) {
    innerAce.ace_inCallStackIfNecessary(utils.CHANGE_ELEMENT_EVENT, function() {
      innerAce.ace_doInsertScriptElement(newElementType);
      self.plugin.elementContentSelector.selectNextElement();
    });
  });
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
