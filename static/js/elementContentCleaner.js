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
  var lineIsHeading = utils.lineIsHeading(currentLine, this.attributeManager);
  var lineIsSceneMark = !utils.lineIsScriptElement(currentLine);

  if (lineIsHeading) {
    var $lineToDelete = this._getParentSMOfHeading(currentLine);
    var sceneMarkLineId = $lineToDelete.attr('id');
    removeSceneMark(sceneMarkLineId);
  } else if (lineIsSceneMark) {
    var sceneMarkLineId = utils.getPadInner().find('div').eq(currentLine).attr('id');
    removeSceneMark(sceneMarkLineId);
  } else {
    this._removeScriptElement(currentLine);
  }
}

elementContentCleaner.prototype._removeScriptElement = function (lineNumberOfSE) {
  var self = this;
  var nextLine = lineNumberOfSE + 1;
  var intervalToRemove = {
    start: [lineNumberOfSE, 0],
    end: [nextLine, 0],
  };
  this.editorInfo.ace_inCallStackIfNecessary('remove_element', function(){
    self.editorInfo.ace_performDocumentReplaceRange(intervalToRemove.start, intervalToRemove.end, '');
  });
}

elementContentCleaner.prototype._getParentSMOfHeading = function (headingLineNumber) {
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

exports.init = function(editorInfo, rep, documentAttributeManager) {
  return new elementContentCleaner(editorInfo, rep, documentAttributeManager);
}
