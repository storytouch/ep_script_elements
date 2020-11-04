var utils = require('./utils');

exports.selectNextElement = function(ace) {
  ace.callWithAce(function(ace) {
    ace.ace_doSelectNextElement();
  });
}

exports.selectPreviousElement = function(ace) {
  ace.callWithAce(function(ace) {
    ace.ace_doSelectPreviousElement();
  });
}

exports.doSelectNextElement = function() {
  var rep = this.rep;
  var editorInfo = this.editorInfo;

  var $line = getCurrentLine(editorInfo);
  var $nextVisibleLine = getFirstVisibleLineAfter($line);

  if ($nextVisibleLine.length === 0) return;

  selectContentOfLine($nextVisibleLine, editorInfo, rep);
}

exports.doSelectPreviousElement = function() {
  var rep = this.rep;
  var editorInfo = this.editorInfo;

  var $line = getCurrentLine(editorInfo);
  var $previousVisibleLine = getFirstVisibleLineBefore($line);

  if ($previousVisibleLine.length === 0) return;

  selectContentOfLine($previousVisibleLine, editorInfo, rep);
}

var getCurrentLine = function(editorInfo) {
  var currentLine = editorInfo.ace_caretLine()
  var $line = utils.getPadInner().find("div").eq(currentLine);
  return $line;
}

var getFirstVisibleLineAfter = function($targetLine) {
  var $nextLines = $targetLine.nextAll('div.ace-line + :not(.hidden)');
  var nextLineIsTheLastLine = $nextLines.length === 0;
  return nextLineIsTheLastLine ?
    $targetLine.next() :
    $nextLines.first();
}

var getFirstVisibleLineBefore = function($targetLine) {
  var $previousLines = $targetLine.prevAll('div.ace-line + :not(.hidden)');
  var previousLineIsTheFirstLine = $previousLines.length === 0;
  return previousLineIsTheFirstLine ?
    $targetLine.prev() :
    $previousLines.first();
}

var selectContentOfLine = function($line, editorInfo, rep) {
  var lineId = $line.attr("id");
  var lineNumber = rep.lines.indexOfKey(lineId);
  var textLength = $line.text().length + 1;
  var beginingOfSelection = [lineNumber, 0];
  var endOfSelection = [lineNumber, textLength];
  editorInfo.ace_inCallStackIfNecessary('selectNextLine', function(){
    editorInfo.ace_performSelectionChange(beginingOfSelection, endOfSelection, true);
    editorInfo.ace_updateBrowserSelectionFromRep();
  })
}
