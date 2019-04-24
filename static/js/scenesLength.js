var _ = require('ep_etherpad-lite/static/js/underscore');

var navigatorUtils = require('ep_scene_navigator/static/js/utils');
var utils = require('./utils');

var scenesLength = function() {
  this._scenesLength = [];
}

scenesLength.prototype.setScenesLength = function(scenesLength) {
  var hasScenesLenghChanged = this._scenesLengthHasChanged(scenesLength);
  if (hasScenesLenghChanged) {
    this._scenesLength = scenesLength;
    this._forceUpdateNavigatorData();
  }
}

scenesLength.prototype.getSceneLengthOfHeading = function(element) {
  // don't do any calculation if scene length is not calculated yet!
  if (this._scenesLength.length === 0) return [];

  var elementIndex = this._getIndexOfElement(element);
  return this._scenesLength[elementIndex];
}

scenesLength.prototype._forceUpdateNavigatorData = function() {
  navigatorUtils.triggerEventToRebuildNavigatorData({forceNavigatorUpdate: true});
}

scenesLength.prototype._scenesLengthHasChanged = function(newScenesLength) {
  if (this._scenesLength.length !== newScenesLength.length) return true;
  return _.isEqual(this._scenesLength, newScenesLength) === false;
}

scenesLength.prototype._getIndexOfElement = function(element) {
  var $headings = utils.getPadInner().find('heading');
  var indexOfElement = $headings.index(element);
  return indexOfElement;
}

exports.init = function() {
  return new scenesLength();
}
