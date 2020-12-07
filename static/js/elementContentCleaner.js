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
    // calculate the number of scene mark lines that will be deleted
    var titleAndSummaryLinesToDelete = this._calculateLinesToDelete(currentLine);

    // calculate the line number to select
    lineToSelect = currentLine - titleAndSummaryLinesToDelete;
  } else {
    // currentLine will be the number of the line after the deleted element
    lineToSelect = currentLine;
  }

  this._removeElement(currentLine, lineIsHeading);

  return lineToSelect;
}

elementContentCleaner.prototype._removeElement = function (lineToRemove, lineIsHeading) {
  var self = this;
  var intervalToRemove = this._getIntervalToRemove(lineToRemove, lineIsHeading);
  this.editorInfo.ace_inCallStackIfNecessary('remove_element', function(){
    self.editorInfo.ace_performDocumentReplaceRange(intervalToRemove.start, intervalToRemove.end, '');
  });
}

elementContentCleaner.prototype._calculateLinesToDelete = function(headingLineNumber) {
  var $heading = utils.getPadInner().find('div').eq(headingLineNumber);
  var linesToDelete = 0;
  var $line = $heading.prev();

  while (true) {
    var lineIsSceneMark = $line.length && $line.hasClass('sceneMark');
    if (lineIsSceneMark) {
      linesToDelete++;
      $line = $line.prev();
    } else break;
  }

  return linesToDelete;
}

elementContentCleaner.prototype._isLastLine = function(lineNumber) {
  var lastLine = utils.getPadInner().find('div').length - 1;
  return lineNumber === lastLine;
}

elementContentCleaner.prototype._getIntervalToRemove = function(lineToRemove, lineIsHeading) {
  var firstLineToRemove, lastLineToRemove;
  if (lineIsHeading) {
    /*
     * in this scenario, the interval to remove starts at the position
     * zero of the top scene mark line, and ends at the position zero
     * of the line after the heading.
     *
     *   [START]scene_name
     *   scene_summary
     *   heading
     *   [END]general
     */
    lastLineToRemove = lineToRemove + 1;
    var $heading = utils.getPadInner().find('div').eq(lineToRemove);
    var $topSM = $heading.prevUntil('div:not(.sceneMark)').last();
    firstLineToRemove = this.rep.lines.indexOfKey($topSM.attr('id'));
  } else {
    /*
     * in this sceneario, the interval to remove starts at the position
     * zero of the current line, and ends at the position zero of the
     * next line.
     *
     *   [START]general 1
     *   [END]general 2
     */
    firstLineToRemove = lineToRemove;
    lastLineToRemove = lineToRemove + 1;
  }

  var intervalToRemove = {
    start: [firstLineToRemove, 0],
    end: [lastLineToRemove, 0],
  };

  var currentLineIsLastLine = this._isLastLine(lineToRemove);
  if (currentLineIsLastLine) {
    var lastLineLength = this.rep.lines.atIndex(lineToRemove).width - 1;
    intervalToRemove.end = [lineToRemove, lastLineLength];
  }

  return intervalToRemove;
}

exports.init = function(editorInfo, rep, documentAttributeManager) {
  return new elementContentCleaner(editorInfo, rep, documentAttributeManager);
}
