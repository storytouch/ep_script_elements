var removeSceneMark = require('ep_script_scene_marks/static/js/removeSceneMark').removeSceneMark;
var utils = require('./utils');

var elementContentCleaner = function(editorInfo, rep, documentAttributeManager) {
  this.editorInfo = editorInfo;
  this.rep = rep;
  this.attributeManager = documentAttributeManager;
}

elementContentCleaner.prototype.deleteElement = function() {
  var self = this;
  var currentLine = this.editorInfo.ace_caretLine();

  var lineIsSceneMark = !utils.lineIsScriptElement(currentLine);
  if (lineIsSceneMark) return;

  var lineToSelect;
  var lineIsHeading = utils.lineIsHeading(currentLine, this.attributeManager);
  if (lineIsHeading) {
    var $lineToDelete = this._getParentSMOfHeading(currentLine);
    var sceneMarkLineId = $lineToDelete.attr('id');
    removeSceneMark(sceneMarkLineId);
    var titleAndSummaryLines = 2; // 2 lines
    // currentLine now is the number of the line after the deleted HEADING
    lineToSelect = currentLine - titleAndSummaryLines;
  } else {
    this._removeScriptElement(currentLine);
    // currentLine now is the number of the line after the deleted ELEMENT
    lineToSelect = currentLine;
  }

  return lineToSelect;
}

elementContentCleaner.prototype._removeScriptElement = function (lineNumberOfSE) {
  var self = this;
  var intervalToRemove = this._getIntervalToRemove(lineNumberOfSE);
  this.editorInfo.ace_inCallStackIfNecessary('remove_element', function(){
    self.editorInfo.ace_performDocumentReplaceRange(intervalToRemove.start, intervalToRemove.end, '');
  });
}

elementContentCleaner.prototype._getParentSMOfHeading = function(headingLineNumber) {
  var $heading = utils.getPadInner().find('div').eq(headingLineNumber);
  var $lastSceneMarkAboveHeading = $heading.prev();
  var keepLookingUpward = true;

  while (keepLookingUpward) {
    var thereIsLineAbove = $lastSceneMarkAboveHeading.prev();
    var lineAboveIsSM = $lastSceneMarkAboveHeading.prev().hasClass('sceneMark');

    if (thereIsLineAbove && lineAboveIsSM) {
      $lastSceneMarkAboveHeading = $lastSceneMarkAboveHeading.prev();
    } else {
      keepLookingUpward = false;
    }
  }

  return $lastSceneMarkAboveHeading;
}

elementContentCleaner.prototype._isLastLine = function(lineNumber) {
  var lastLine = utils.getPadInner().find('div').length - 1;
  return lineNumber === lastLine;
}

elementContentCleaner.prototype._getIntervalToRemove = function(firstLineToRemove) {
  var nextLine = firstLineToRemove + 1;
  var currentLineIsLastLine = this._isLastLine(firstLineToRemove);
  var intervalToRemove = {
    start: [firstLineToRemove, 0],
    end: [nextLine, 0],
  };

  if (currentLineIsLastLine) {
    var lastLineLength = this.rep.lines.atIndex(firstLineToRemove).width - 1;
    intervalToRemove.end = [firstLineToRemove, lastLineLength];
  }

  return intervalToRemove;
}

exports.init = function(editorInfo, rep, documentAttributeManager) {
  return new elementContentCleaner(editorInfo, rep, documentAttributeManager);
}
