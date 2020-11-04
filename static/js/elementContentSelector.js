var utils = require('./utils');

var elementContentSelector = function(editorInfo, rep) {
  this.editorInfo = editorInfo;
  this.rep = rep;
}

elementContentSelector.prototype.selectNextElement = function() {
  var $line = this._getCurrentLine();
  var $nextVisibleLine = this._getFirstVisibleLineAfter($line);

  if ($nextVisibleLine.length === 0) return;

  this._selectContentOfLine($nextVisibleLine);
}

elementContentSelector.prototype.selectPreviousElement = function() {
  var $line = this._getCurrentLine();
  var $previousVisibleLine = this._getFirstVisibleLineBefore($line);

  if ($previousVisibleLine.length === 0) return;

  this._selectContentOfLine($previousVisibleLine);
}

elementContentSelector.prototype._getCurrentLine = function() {
  var currentLine = this.editorInfo.ace_caretLine()
  var $line = utils.getPadInner().find("div").eq(currentLine);
  return $line;
}

elementContentSelector.prototype._getFirstVisibleLineAfter = function($targetLine) {
  var $nextLines = $targetLine.nextAll('div.ace-line + :not(.hidden)');
  var nextLineIsTheLastLine = $nextLines.length === 0;
  return nextLineIsTheLastLine ?
    $targetLine.next() :
    $nextLines.first();
}

elementContentSelector.prototype._getFirstVisibleLineBefore = function($targetLine) {
  var $previousLines = $targetLine.prevAll('div.ace-line + :not(.hidden)');
  var previousLineIsTheFirstLine = $previousLines.length === 0;
  return previousLineIsTheFirstLine ?
    $targetLine.prev() :
    $previousLines.first();
}

elementContentSelector.prototype._selectContentOfLine = function($line) {
  var self = this;
  var lineId = $line.attr("id");
  var lineNumber = self.rep.lines.indexOfKey(lineId);
  var textLength = $line.text().length + 1;
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
