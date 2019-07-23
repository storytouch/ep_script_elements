var _ = require('ep_etherpad-lite/static/js/underscore');
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var detailedLinesChangedListener = require('ep_script_scene_marks/static/js/detailedLinesChangedListener');

var calculateSceneEdgesLength = function() {
  this._listenToElementsChanges();
};

calculateSceneEdgesLength.prototype._listenToElementsChanges = function() {
  var self = this;
  detailedLinesChangedListener.onLinesAddedOrRemoved(function(linesChanged) {
    // as an edition on one scene may change the length of the previous scene,
    // see https://trello.com/c/fvdjvPX0/1906, we clean the cache of the
    // current scene and the previous one
    var firstElementOfChangedScenes = self._getFirstElementOfScenes(linesChanged.linesAdded);
    var firstElementOfPreviousScenes = self._getFirstElementOfPreviousScenes(firstElementOfChangedScenes);
    var headingsOfChangedSceneAndPreviousOne = firstElementOfChangedScenes.concat(firstElementOfPreviousScenes);
    var lastElementOfChangedScenes = self._getLastElementOfScenes(headingsOfChangedSceneAndPreviousOne);
    var scenesEdge = _.flatten(headingsOfChangedSceneAndPreviousOne.concat(lastElementOfChangedScenes));
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

calculateSceneEdgesLength.prototype._getFirstElementOfPreviousScenes = function(headingLineOfChangedScene) {
  return this._filterLinesBy(this._getFirstElementOfPreviousScene, headingLineOfChangedScene)
}

calculateSceneEdgesLength.prototype._filterLinesBy = function(filter, linesChanged) {
  return _.chain(linesChanged)
    .map(filter)
    .reject(function(line) { return line.length === 0})
    .compact()
    .uniq(function(line) { return line[0].id }) // remove duplicated lines
    .value();
};

calculateSceneEdgesLength.prototype._getfirstElementOfScene = function(line) {
  // if the edition is on a scene mark the scene affected is below this line
  var isLineSceneMark = $(line).hasClass('sceneMark');
  if (isLineSceneMark) {
    return $(line).nextUntil('.withHeading').addBack().last().next();
  }

  return $(line).prevUntil('.sceneMark').addBack().first();
};

calculateSceneEdgesLength.prototype._getLastElementOfScene = function(line) {
  return $(line).nextUntil('.sceneMark').addBack().last();
};

calculateSceneEdgesLength.prototype._getFirstElementOfPreviousScene = function(headingLineOfNextScene) {
  return $(headingLineOfNextScene).prevUntil('.withHeading').last().prev();
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
