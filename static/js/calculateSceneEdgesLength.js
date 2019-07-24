var _ = require('ep_etherpad-lite/static/js/underscore');
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var detailedLinesChangedListener = require('ep_script_scene_marks/static/js/detailedLinesChangedListener');

var calculateSceneEdgesLength = function() {
  this._listenToElementsChanges();
};

calculateSceneEdgesLength.prototype._listenToElementsChanges = function() {
  var self = this;
  detailedLinesChangedListener.onLinesAddedOrRemoved(function(linesChanged) {
    var linesToResetCache = _.map(linesChanged.linesAdded, function(line) {
      return self._getLinesToResetCache(line);
    }, this)
    self._cleanElementDimensionCache(_.flatten(linesToResetCache));
  });
};

/*
when there is an edition we can have two scenarios:
1. Edition was made between the heading and last element of a scene (inclusive) - 
  In this case we only need to reset the cache of the edges of this scene. It's
  important to mention that even though the heading position does not change we
  have to update it (edition on the middle of a scene). Doing that we avoid a
  problem with the calculation of the scene length on other user's pad, (see
  https://trello.com/c/fvdjvPX0/1906 - When an element very next to a heading
  is edited, the heading is collected only in the document where this edition
  was made. As the heading of other user's pad is not collected, we have to
  force to recalculate it).

2. Edition was made before the beginning of a scene (any scene mark) -
  if an edition is made on scene marks besides of resetting the cache of the
  edges of the current scene we reset the cache of the edges of the previous
  scene as well. We do it because editions on scene marks may change the length
  of the previous scene as well, see https://trello.com/c/fvdjvPX0/1906
*/
calculateSceneEdgesLength.prototype._getLinesToResetCache = function(line) {
  var firstElementOfChangedScene = this._getFirstElementOfScene(line);
  var lastElementOfChangedScene = this._getLastElementOfScene(firstElementOfChangedScene);
  var linesToResetCache = [firstElementOfChangedScene, lastElementOfChangedScene]; // [1]

  var needUpdateFullSceneAndPreviousOne = $(line).hasClass('sceneMark');
  if (needUpdateFullSceneAndPreviousOne) { // [2]
    var firstElementOfPreviousScene = this._getFirstElementOfPreviousScene(firstElementOfChangedScene);
    var lastElementOfPreviousScene = this._getLastElementOfScene(firstElementOfPreviousScene);
    var linesToResetCache = linesToResetCache.concat(firstElementOfPreviousScene, lastElementOfPreviousScene);
  }

  return linesToResetCache;
}

calculateSceneEdgesLength.prototype._cleanElementDimensionCache = function(elements) {
  _.each(elements, function(element) {
    element.children().get(0)._boundingClientRect = null;
  });
};

calculateSceneEdgesLength.prototype._getFirstElementOfScene = function(line) {
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
