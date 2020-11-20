var utils = require('./utils');

var elementContentSelector = function(editorInfo, rep) {
  this.editorInfo = editorInfo;
  this.rep = rep;
}

var iterators = {
  previousLine: function($line) { return $line.prev() },
  nextLine: function($line) { return $line.next() },
}

elementContentSelector.prototype.selectNextElement = function() {
  this._selectLine(iterators.nextLine);
}

elementContentSelector.prototype.selectPreviousElement = function() {
  this._selectLine(iterators.previousLine);
}

elementContentSelector.prototype.selectCurrentElement = function() {
  var currentLine = this.editorInfo.ace_caretLine()
  this.selectElement(currentLine);
}

elementContentSelector.prototype.selectElement = function(lineNumber) {
  var $line = utils.getPadInner().find('div').eq(lineNumber);
  if ($line.length === 0) return;

  var lineIsSceneMark = !utils.lineIsScriptElement(lineNumber);
  if (lineIsSceneMark) {
    lineNumber = this._getNonSceneMarkLineNumber($line, iterators.nextLine);
    if (lineNumber === undefined) return;
  }

  this._selectContentOfLine(lineNumber);
}

// select a non sceneMark line according to iterator function
elementContentSelector.prototype._selectLine = function(iterator) {
  var $currentLine = this._getCurrentLine();
  var numberOfLineToSelect = this._getNonSceneMarkLineNumber($currentLine, iterator);
  if (numberOfLineToSelect === undefined) return;
  this._selectContentOfLine(numberOfLineToSelect);
}

elementContentSelector.prototype._getCurrentLine = function() {
  var currentLine = this.editorInfo.ace_caretLine()
  var $line = utils.getPadInner().find('div').eq(currentLine);
  return $line;
}

elementContentSelector.prototype._getNonSceneMarkLineNumber = function($line, iterator) {
  var $targetLine = iterator($line);
  if (!$targetLine.length) return undefined;
  if ($targetLine.hasClass('sceneMark')) {
    return this._getNonSceneMarkLineNumber($targetLine, iterator);
  }

  var targetLineNumber = this.rep.lines.indexOfKey($targetLine.attr('id'));
  return targetLineNumber;
}

elementContentSelector.prototype._selectContentOfLine = function(targetLineNumber) {
  var self = this;
  var lineLength = this.rep.lines.atIndex(targetLineNumber).width;
  var beginingOfSelection = [targetLineNumber, 0];
  var endOfSelection = [targetLineNumber, lineLength];
  this.editorInfo.ace_inCallStackIfNecessary('selectNextLine', function(){
    self.editorInfo.ace_performSelectionChange(beginingOfSelection, endOfSelection, true);
    self.editorInfo.ace_updateBrowserSelectionFromRep();
  });
}

exports.init = function(editorInfo, rep) {
  return new elementContentSelector(editorInfo, rep);
}
