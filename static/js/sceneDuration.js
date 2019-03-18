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
  var lineNumber = utils.getLineFromLineId(rep, lineId);
  var durationInSeconds = duration * 60; // save an integer number for ease of manipulation
  attributeManager.setAttributeOnLine(lineNumber, shared.SCENE_DURATION_ATTRIB_NAME, durationInSeconds);
}
