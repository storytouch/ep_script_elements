var _ = require('ep_etherpad-lite/static/js/underscore');
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var detailedLinesChangedListener = require('ep_script_scene_marks/static/js/detailedLinesChangedListener');

var calculateSceneEdgesLength = function() {
  this._listenToElementsChanges();
};

calculateSceneEdgesLength.prototype._listenToElementsChanges = function() {
  var self = this;
  detailedLinesChangedListener.onLinesAddedOrRemoved(function(linesChanged) {
    var firstElementOfChangedScene = self._getFirstElementOfScenes(linesChanged.linesAdded);
    var lastElementOfChangedScene = self._getLastElementOfScenes(firstElementOfChangedScene);
    var scenesEdge = lastElementOfChangedScene.concat(firstElementOfChangedScene);
    self._cleanElementDimensionCache(scenesEdge);
  });
};

calculateSceneEdgesLength.prototype._cleanElementDimensionCache = function(elements) {
  _.each(elements, function(element) {
    element.children().get(0)._boundingClientRect = null;
  });
};

calculateSceneEdgesLength.prototype._getLastElementOfScenes = function(linesChanged) {
  return this._filterLinesBy(this._getLastElementOfScene, linesChanged)
}

calculateSceneEdgesLength.prototype._getFirstElementOfScenes = function(linesChanged) {
  return this._filterLinesBy(this._getfirstElementOfScene, linesChanged)
}

calculateSceneEdgesLength.prototype._filterLinesBy = function(filter, linesChanged) {
  return _.chain(linesChanged)
    .map(filter)
    .compact()
    .uniq(function() { return this[0].id }) // remove duplicated lines
    .value();
};

calculateSceneEdgesLength.prototype._getfirstElementOfScene = function(line) {
  return $(line).prevUntil('.sceneMark').addBack().first();
};

calculateSceneEdgesLength.prototype._getLastElementOfScene = function(line) {
  return $(line).nextUntil('.sceneMark').addBack().last();
};

calculateSceneEdgesLength.prototype.getElementBoundingClientRect = function(element) {
  // check if we already got the client rect before.
  if (!element._boundingClientRect) {
    // if not, get it then store it for future use.
    element._boundingClientRect = element.getBoundingClientRect();
  }
  return element._boundingClientRect;
};

exports.init = function() {
  return new calculateSceneEdgesLength();
};
