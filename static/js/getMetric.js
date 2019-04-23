var shared = require('./shared');
var utils = require('./utils');

var sceneDurationClassPrefix = shared.SCENE_DURATION_CLASS_PREFIX;
exports.GET_METRIC = {
  eighth: getHeightOfScene,
  duration: getDurationOfScene,
}

function getDurationOfScene(element) {
  var elementClasses = element.classList;
  var sceneDurationClass = Array.from(elementClasses).find(isSceneDurationClass);
  var defaultValue = '30'; // we assume that the minimum duration is 30'
  var durationOfScene = sceneDurationClass ? sceneDurationClass.split('-')[1] : defaultValue;
  return Number(durationOfScene);
}

function getHeightOfScene(element) {
  var thisPlugin = utils.getThisPluginProps();
  return thisPlugin.scenesLength.getSceneLengthOfHeading(element);
}

var isSceneDurationClass = function(className) {
  return className.startsWith(sceneDurationClassPrefix);
}
