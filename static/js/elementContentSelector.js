var utils = require('./utils');

exports.selectNextElement = function(ace) {
  ace.callWithAce(function(ace) {
    ace.ace_doSelectNextElement();
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

var getCurrentLine = function(editorInfo) {
  var currentLine = editorInfo.ace_caretLine()
  var $line = utils.getPadInner().find("div").eq(currentLine);
  return $line;
}

var getFirstVisibleLineAfter = function($targetLine) {
  var $lastHiddenLineAfterTargetLine = $targetLine.nextUntil(':not(.hidden)').addBack().last();
  return $lastHiddenLineAfterTargetLine.next();
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
