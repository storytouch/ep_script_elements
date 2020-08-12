var epSEDShared = require('ep_script_dimensions/static/js/shared');
var epSEDUtils = require('ep_script_dimensions/static/js/utils');

var utils = require('./utils');

var calculateSceneLength = function(attributeManager, rep, editorInfo) {
  this.attributeManager = attributeManager;
  this.rep = rep;
  this.editorInfo = editorInfo;
  this.thisPlugin = utils.getThisPluginProps();
  this.userLines = [];
  this._listenToUserLinesChanged();
};

calculateSceneLength.prototype.run = function(forceCalculateScenesLength) {
  // we need to calculate the scenes length when user loads the script to get
  // the eighth of the script. At this moment EASC has not initiliazed yet, so
  // "scriptElementsAreVisible" is "undefined". Once the script has loaded we
  // only calculate the scenes length when the script elements are visible
  var scriptElementsAreVisible = this.thisPlugin.isScriptActivated;
  if (!(scriptElementsAreVisible || forceCalculateScenesLength)) {
    return;
  }

  if (forceCalculateScenesLength) {
    this.userLines = pad.plugins.ep_script_dimensions.calculateUserLines.getUserLines();
  }

  var headings = this._getScenesUserLines();
  var scenesLength = headings.map(function(heading) {
    return this._getSceneHeight(heading);
  }, this);

  this.thisPlugin.scenesLength.setScenesLength(scenesLength);
};

calculateSceneLength.prototype._listenToUserLinesChanged = function() {
  var $innerDoc = utils.getPadInner().find('#innerdocbody');
  var self = this;
  $innerDoc.on(epSEDShared.USERS_LINES_CHANGED, function(event, data) {
    self.userLines = data.userLines;
    self.run();
  });
};

// get all user lines of a scene
calculateSceneLength.prototype._getScenesUserLines = function() {
  var scenes = [];
  var sceneLinesBuffer = [];
  var lastHeadingParentIndex = -1;

  this.userLines.forEach(function(userLine) {
    // we do not process scene marks
    if (epSEDUtils.isLineTypeASceneMark(userLine.type)) return;

    var isHeading = epSEDUtils.isLineTypeAHeading(userLine.type);
    var isNewHeading = isHeading && userLine.parentIndex !== lastHeadingParentIndex;

    if (isNewHeading) {
      if (sceneLinesBuffer.length) scenes.push(sceneLinesBuffer);
      sceneLinesBuffer = [];
      lastHeadingParentIndex = userLine.parentIndex;
    }

    sceneLinesBuffer.push(userLine);
  });

  // last iteration
  if (sceneLinesBuffer.length) {
    scenes.push(sceneLinesBuffer);
  }

  return scenes;
};

calculateSceneLength.prototype._getSceneHeight = function(headingUserLines) {
  return headingUserLines.reduce(function(sum, userLine) {
    // Headings have double spacing, but when SceneMarks are visible,
    // this margin is different. As we do not consider SceneMarks is
    // this calculation, we need to force the double spacing on headings.
    var isHeading = epSEDUtils.isLineTypeAHeading(userLine.type) ;
    var marginTop = isHeading ? epSEDShared.DOUBLE_LINE_SPACING : userLine.marginTop;
    return sum + userLine.height + marginTop + userLine.marginBottom;
  }, 0);
};

exports.init = function() {
  var context = this;
  var attributeManager = context.documentAttributeManager;
  var rep = context.rep;
  var editorInfo = context.editorInfo;
  return new calculateSceneLength(attributeManager, rep, editorInfo);
};
