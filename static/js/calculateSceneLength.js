var _ = require('ep_etherpad-lite/static/js/underscore');

var shared = require('./shared');
var utils = require('./utils');
var getMetric = require('./getMetric');

var calculateSceneLength = function(attributeManager, rep, editorInfo) {
  this.attributeManager = attributeManager;
  this.rep = rep;
  this.editorInfo = editorInfo;
  this.thisPlugin = utils.getThisPluginProps();
  this.calculateSceneEdgesLength = this.thisPlugin.calculateSceneEdgesLength;
};

calculateSceneLength.prototype.run = function() {
  // when script is disable on EASC we don't calculate the scene length
  var headingsAreVisible = this.thisPlugin.isScriptActivated;
  if (!headingsAreVisible) {
    return;
  }

  var lineDefaultSize = utils.getLineDefaultSize();
  var $headings = utils.getPadInner().find('div:has(heading)');

  var $sceneIntervals = this._getSceneIntervals($headings);
  var scenesLength = _.map($sceneIntervals, function($sceneInterval) {
    var sceneLength = this._getSceneLength($sceneInterval, lineDefaultSize);
    return sceneLength;
  }, this);

  this.thisPlugin.scenesLength.setScenesLength(scenesLength);
};

calculateSceneLength.prototype._getSceneIntervals = function($headings) {
  return $headings.map(function(){
    return $(this).nextUntil('.sceneMark').addBack();
  });
};

calculateSceneLength.prototype._getSceneLength = function($interval, lineDefaultSize) {
  var firstElementOfScene = $interval.first().children().get(0); // always a heading
  var lastElementOfScene = $interval.last().children().get(0);

  // when we get the first element top we only get its height without
  // considering the space that exists between it and the previous element.
  // Because of that, we add the 2 lines to it
  var additionalHeadingMargin = (2 * lineDefaultSize);
  var firstElementTop = this.calculateSceneEdgesLength.getElementBoundingClientRect(firstElementOfScene).top - additionalHeadingMargin;

  var lastElementBottom = this.calculateSceneEdgesLength.getElementBoundingClientRect(lastElementOfScene).bottom;
  return lastElementBottom - firstElementTop;
};

calculateSceneLength.prototype.getSumOfAllScenesUntilScene = function($heading) {
  var $allHeadingsUntilSceneTarget = this._getScenesTarget($heading);
  var sumOfAllSceneUntilSceneTarget = _.reduce($allHeadingsUntilSceneTarget, function(sumOfSceneLength, div) {
    var element = $(div).children().get(0);
    var getEighth = getMetric.GET_METRIC['eighth'];
    var sceneLength = getEighth(element);
    return sumOfSceneLength + sceneLength;
  }, 0);
  return sumOfAllSceneUntilSceneTarget;
}

calculateSceneLength.prototype._getScenesTarget = function($heading) {
  var $allHeadings = utils.getPadInner().find('div:has(heading)');
  var indexOfHeadingTarget = $allHeadings.index($heading);
  return $allHeadings.slice(0, indexOfHeadingTarget);
}

exports.init = function() {
  var context = this;
  var attributeManager = context.documentAttributeManager;
  var rep = context.rep;
  var editorInfo = context.editorInfo;
  return new calculateSceneLength(attributeManager, rep, editorInfo);
};
