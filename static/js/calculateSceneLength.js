var _ = require('ep_etherpad-lite/static/js/underscore');

var shared = require('./shared');
var utils = require('./utils');

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
  this._applyAttributeOnScene($headings, scenesLength);
};

calculateSceneLength.prototype._applyAttributeOnScene = function($headings, scenesLength) {
  _.each($headings, function(heading, index){
    this._applyAttributeOnLineIfNecessary(heading, scenesLength[index]);
  }, this);
};

calculateSceneLength.prototype._applyAttributeOnLineIfNecessary= function(element, attribValue) {
  var self = this;
  self.editorInfo.ace_inCallStackIfNecessary('nonundoable', function(){
    // we check the script element attribute value to avoid applying a line
    // attribute on a line that is not heading. E.g. on tests is common to have
    // something like '<div><action>...<br><heading>...<br><other>...<br>',
    // what is not a 'heading' but it has the '<heading>'
    var $element = $(element);
    var line =  utils.getLineNumberFromDOMLine($element, self.rep);
    var scriptElementType = utils.getLineType(line, self.attributeManager);
    var isHeading = scriptElementType === 'heading';

    if (isHeading && self._sceneLengthChanged(line, attribValue)) {
      self.attributeManager.removeAttributeOnLine(line, shared.SCENE_LENGTH_ATTRIB_NAME);
      self.attributeManager.setAttributeOnLine(line, shared.SCENE_LENGTH_ATTRIB_NAME, attribValue);
    }
  });
};

calculateSceneLength.prototype._sceneLengthChanged = function(lineNumber, sceneLengthUpdated) {
  var actualSceneLengthValue = this.attributeManager.getAttributeOnLine(lineNumber, shared.SCENE_LENGTH_ATTRIB_NAME);
  return Number(actualSceneLengthValue) !== sceneLengthUpdated;
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
    var sceneLength = utils.getHeightOfSceneFromHeadingClass(element);
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
