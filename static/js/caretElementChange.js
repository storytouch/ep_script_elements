var _ = require('ep_etherpad-lite/static/js/underscore');

var smUtils = require('ep_script_scene_marks/static/js/utils');

var utils = require('./utils');
var api   = require('./api');

exports.sendMessageCaretElementChanged = function(context) {
  var callerContext    = context || this;
  var rep              = callerContext.rep;
  var attributeManager = callerContext.documentAttributeManager;
  var sameElementOnSelection = isSameElementOnSelection(rep, attributeManager);
  var elementOfCurrentLine;
  var sceneMarkSetType;
  var currentLine = rep.selStart[0];
  var $currentLine = $(rep.lines.atIndex(currentLine).lineNode);
  var isLineScriptElement = utils.domLineIsAScriptElement($currentLine);
  if (sameElementOnSelection && isLineScriptElement) {
    elementOfCurrentLine = utils.getLineType(currentLine, attributeManager) || 'general';
  }

  // when elementOfCurrentLine is undefined means it is a scene mark
  if (elementOfCurrentLine === undefined || elementOfCurrentLine === 'heading') {
    var firstSMOfSet = smUtils.getFirstSceneMarkTagOfSet($currentLine); // e.g episode_name, sequence_name
    sceneMarkSetType = firstSMOfSet ? firstSMOfSet.split('_')[0] : undefined; // episode, act, sequence, scene
  }

  api.triggerCaretElementChanged(elementOfCurrentLine);
  api.triggerSMSetElementChanged(sceneMarkSetType);
}

var isSameElementOnSelection = function(rep, attributeManager) {
  var firstLine = rep.selStart[0];
  var isSameElement = true;
  var lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  //get the first attribute on the selection
  var firstAttribute = utils.getLineType(firstLine, attributeManager);
  //check if the first attribute on selection is present in all lines
  _(_.range(firstLine + 1, lastLine + 1)).each(function(line) {
    var attributeOnline = utils.getLineType(line, attributeManager);
    if (attributeOnline !== firstAttribute) {
      isSameElement = false;
      return;
    }
  });
  return isSameElement;
}
