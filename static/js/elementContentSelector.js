var utils = require('./utils');
var epSDShared = require('ep_script_dimensions/static/js/shared');

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

// select a non sceneMark line according to iterator function
elementContentSelector.prototype._selectLine = function(iterator) {
  var $line = this._getCurrentLine();
  var $previousLine = this._getNonSceneMarkLine($line, iterator);
  if ($previousLine === undefined) return;
  this._selectContentOfLine($previousLine);
}

elementContentSelector.prototype._getCurrentLine = function() {
  var currentLine = this.editorInfo.ace_caretLine()
  var $line = utils.getPadInner().find('div').eq(currentLine);
  return $line;
}

elementContentSelector.prototype._getNonSceneMarkLine = function($line, iterator) {
  var $targetLine = iterator($line);
  if (!$targetLine.length) return undefined;
  if ($targetLine.hasClass('sceneMark')) {
    return this._getNonSceneMarkLine($targetLine, iterator);
  }
  return $targetLine;
}

elementContentSelector.prototype._selectContentOfLine = function($line) {
  var self = this;
  var lineId = $line.attr('id');
  var targetLineNumber = this.rep.lines.indexOfKey(lineId);
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
