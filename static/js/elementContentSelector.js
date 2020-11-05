var utils = require('./utils');
var epSDShared = require('ep_script_dimensions/static/js/shared');

var elementContentSelector = function(editorInfo, rep) {
  this.editorInfo = editorInfo;
  this.rep = rep;
}

elementContentSelector.prototype.selectNextElement = function(userLines) {
  var self = this;
  var $line = this._getCurrentLine();
  var $innerDoc = utils.getPadInner().find('#innerdocbody');

  /*
   * there are two ways to select next element:
   *
   * [1] - when the user just wants to select the next element. In this case
   * we can use the available userLines in ep_script_dimensions;
   *
   * [2] - after the user changes the type of the current line (reformat).
   * In this case we have to wait for the user lines to be updated.
   */
  if (userLines) { // [1]
    var nextLineNumber = self._getFirstVisibleLineAfter($line, userLines)
    if (nextLineNumber === undefined) return;
    self._selectContentOfLine(nextLineNumber);
  } else { // [2]
    $innerDoc.one(epSDShared.USERS_LINES_CHANGED, function(event, data) {
      var nextLineNumber = self._getFirstVisibleLineAfter($line, data.userLines)
      if (nextLineNumber === undefined) return;
      self._selectContentOfLine(nextLineNumber);
    });
  }
}

elementContentSelector.prototype.selectPreviousElement = function(userLines) {
  var self = this;
  var $line = this._getCurrentLine();

  /*
   * we don't need to listen to USERS_LINES_CHANGED event here, because
   * unlike the selectNextElement, this function does not preceeds a
   * function that changes the user lines.
   */
  var previousLineNumber = self._getFirstVisibleLineBefore($line, userLines)
  if (previousLineNumber === undefined) return;
  self._selectContentOfLine(previousLineNumber);
}

elementContentSelector.prototype._getCurrentLine = function() {
  var currentLine = this.editorInfo.ace_caretLine()
  var $line = utils.getPadInner().find('div').eq(currentLine);
  return $line;
}

elementContentSelector.prototype._getFirstVisibleLineAfter = function($targetLine, userLines) {
  var lineNumber = utils.getLineNumberFromDOMLine($targetLine, this.rep);
  var nextVisibleUserLine = userLines.find(function(userLine) {
    return userLine.parentIndex > lineNumber && userLine.visible;
  });
  return nextVisibleUserLine ? nextVisibleUserLine.parentIndex : undefined;
}

elementContentSelector.prototype._getFirstVisibleLineBefore = function($targetLine, userLines) {
  var lineNumber = utils.getLineNumberFromDOMLine($targetLine, this.rep);
  if (lineNumber === 0) { return undefined; }

  var previousVisibleUserLine;
  for (var i = 0; i < userLines.length; i++) {
    if (userLines[i].parentIndex === lineNumber) { break; }
    if (userLines[i].visible) { previousVisibleUserLine = userLines[i]; }
  }
  return previousVisibleUserLine ? previousVisibleUserLine.parentIndex : undefined;
}

elementContentSelector.prototype._selectContentOfLine = function(lineNumber) {
  var self = this;
  var textLength = utils.getPadInner().find('div').eq(lineNumber).text().length + 1;
  var beginingOfSelection = [lineNumber, 0];
  var endOfSelection = [lineNumber, textLength];
  self.editorInfo.ace_inCallStackIfNecessary('selectNextLine', function(){
    self.editorInfo.ace_performSelectionChange(beginingOfSelection, endOfSelection, true);
    self.editorInfo.ace_updateBrowserSelectionFromRep();
  })
}

exports.init = function(editorInfo, rep) {
  return new elementContentSelector(editorInfo, rep);
}
