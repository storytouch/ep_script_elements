var _ = require('ep_etherpad-lite/static/js/underscore');
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var detailedLinesChangedListener = require('ep_script_scene_marks/static/js/detailedLinesChangedListener');
var scheduler = require('./scheduler');
var utils = require('./utils');

var TIMEOUT_TO_CLEAN_DIMENSIONS = 840;
var TIMEOUT_TO_TRIGGER_MESSAGE_SCRIPT_LENGTH = 880;

var calculateSceneEdgesLength = function() {
  this._timeoutToCleanDimensions = TIMEOUT_TO_CLEAN_DIMENSIONS; // allow to override on tests
  this._timeoutToTriggerMessageThatScripLengthHasChanged = TIMEOUT_TO_TRIGGER_MESSAGE_SCRIPT_LENGTH; // allow to override on tests
  this._cleanElementDimensionCacheScheduled = scheduler.init(this._cleanElementDimensionCache.bind(this), this._timeoutToCleanDimensions);
  this._triggerMessageThatScriptLengthHasChangedScheduler = scheduler.init(this._triggerMessageThatScriptLengthHasChanged.bind(this), this._timeoutToTriggerMessageThatScripLengthHasChanged);
  this._linesToCleanCache = [];
  this._prevLinesOfChangeId = [];
  this._listenToElementsChanges();
};

calculateSceneEdgesLength.prototype._listenToElementsChanges = function() {
  var self = this;
  detailedLinesChangedListener.onLinesAddedOrRemoved(function(linesChanged) {
    self._triggerMessageThatScriptLengthHasChangedScheduler.schedule();
    linesChanged.linesAdded.forEach(self._scheduleCleanCacheDimensions.bind(self));
  });
};

calculateSceneEdgesLength.prototype._triggerMessageThatScriptLengthHasChanged = function() {
  var $innerDoc = utils.getPadInner().find('#innerdocbody');
  $innerDoc.trigger(utils.SCRIPT_LENGTH_CHANGED, {forceNavigatorUpdate: false});
}

calculateSceneEdgesLength.prototype._scheduleCleanCacheDimensions = function(line) {
  // don't need to clean the cache straight away. Wait until it invalidates the
  // timeout to run the cleaning
  this._cleanElementDimensionCacheScheduled.schedule();

  // if already there is a cache cleaning scheduled on this line, it postpones
  // the execution. This improves the performance when user is typing on the
  // same line
  if (!this._hasScheduledTaskForThisLine(line)) {
    // calculate the lines that will be "cleaned" next time the function runs
    var linesToCleanCache = this._getUniqLinesToResetCache(line);
    this._linesToCleanCache = this._linesToCleanCache.concat(linesToCleanCache);

    // here we keep the previous line where the edition is being made. We use
    // this line to check if user is repeatedly editing the same line - what it's
    // the normal case when user is typing a sentence. As every time user edits
    // a line it updates its own id, we can't use it
    var idOfPreviousLine = line.previousSibling && line.previousSibling.id || line.id; // avoid error on first line of script
    this._prevLinesOfChangeId = this._prevLinesOfChangeId.concat(idOfPreviousLine)
  }
}

calculateSceneEdgesLength.prototype._hasScheduledTaskForThisLine = function(line) {
  var prevLineOfEditionId = line.previousSibling && line.previousSibling.id || '';
  return this._prevLinesOfChangeId.includes(prevLineOfEditionId);
}

calculateSceneEdgesLength.prototype._getUniqLinesToResetCache = function(line) {
  var linesToResetCache = this._getLinesToResetCache(line);
  return _.chain(linesToResetCache)
    .flatten()
    .reject(function(line) { return line.length === 0}) // remove undefined lines
    .uniq(function(line) { return line[0].id }) // remove duplicated lines
    .value();
}

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
  var headingOfChangedScene = this._getHeadingOfScene(line);
  var lastElementOfChangedScene = this._getLastElementOfScene(headingOfChangedScene);
  var linesToResetCache = [headingOfChangedScene, lastElementOfChangedScene]; // [1]

  var needUpdateFullSceneAndPreviousOne = $(line).hasClass('sceneMark');
  if (needUpdateFullSceneAndPreviousOne) { // [2]
    var headingOfPreviousScene = this._getHeadingOfPreviousScene(headingOfChangedScene);
    var lastElementOfPreviousScene = this._getLastElementOfScene(headingOfPreviousScene);
    var linesToResetCache = linesToResetCache.concat(headingOfPreviousScene, lastElementOfPreviousScene);
  }

  return linesToResetCache;
}

calculateSceneEdgesLength.prototype._cleanElementDimensionCache = function() {
  _.each(this._linesToCleanCache, function(element) {
    var target = element.children().get(0);
    if (target) target._boundingClientRect = null;
  });
  this._resetTempVariables();
};

calculateSceneEdgesLength.prototype._resetTempVariables = function() {
  this._linesToCleanCache = [];
  this._prevLinesOfChangeId = [];
}

calculateSceneEdgesLength.prototype._getHeadingOfScene = function(line) {
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

calculateSceneEdgesLength.prototype._getHeadingOfPreviousScene = function(headingLineOfNextScene) {
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
