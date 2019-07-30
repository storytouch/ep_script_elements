var utils = require('./utils');
var shared = require('./shared');

exports.setSceneDuration = function(ace, lineId, duration) {
  ace.callWithAce(function(innerAce){
    innerAce.ace_inCallStackIfNecessary('nonundoable', function() {
      innerAce.ace_addSceneDurationAttribute(lineId, duration);
    })
  })
}

exports.addSceneDurationAttribute = function(lineId, duration) {
  var rep = this.rep;
  var attributeManager = this.documentAttributeManager;
  var lineNumber = _getNextHeadingFromLineId(rep, lineId);
  var durationInSeconds = duration * 60; // save an integer number for ease of manipulation
  attributeManager.setAttributeOnLine(lineNumber, shared.SCENE_DURATION_ATTRIB_NAME, durationInSeconds);
}

// the scene duration API can receive two types of lines as the lineId, either
// a heading or a scene_name. When it is a heading we only the return its "id".
// When it's a scene_name we return the heading id which this element is part
var _getNextHeadingFromLineId = function(rep, lineId) {
  var $line = utils.getPadInner().find(`#${lineId}`);
  var isLineAHeading = $line.find('heading').length;
  if (!isLineAHeading) {
    var $heading = $line.nextUntil('div:has(heading)').addBack().last().next();
    lineId = $heading.attr('id');
  }
  var lineNumber = utils.getLineFromLineId(rep, lineId);
  return lineNumber;
}
