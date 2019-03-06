var _ = require('ep_etherpad-lite/static/js/underscore');
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var detailedLinesChangedListener = require('ep_script_scene_marks/static/js/detailedLinesChangedListener');

var calculateSceneEdgesLength = function() {
  this._listenToElementsChanges();
};

calculateSceneEdgesLength.prototype._listenToElementsChanges = function() {
  var self = this;
  detailedLinesChangedListener.onLinesAddedOrRemoved(function(linesChanged) {
    var lastElementOfChangedScene = self._getLastElementOfSceneChanged(linesChanged.linesAdded);
    self._cleanElementDimensionCache(lastElementOfChangedScene);
  });
};

calculateSceneEdgesLength.prototype._cleanElementDimensionCache = function(elements) {
  _.each(elements, function(element) {
    element.children().get(0)._boundingClientRect = null;
  });
};

calculateSceneEdgesLength.prototype._getLastElementOfSceneChanged = function(linesChanged) {
  var self = this;
  var lastElementsOfScene = _.chain(linesChanged)
    .map(self._getLastElementOfScene)
    .compact()
    .value();
  return lastElementsOfScene;
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
