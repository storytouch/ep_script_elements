var _ = require('ep_etherpad-lite/static/js/underscore');
var $ = require('ep_etherpad-lite/static/js/rjquery').$;

var shared = require('./shared');
var utils = require('./utils');
var randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
var linesChangedListener = require('ep_comments_page/static/js/linesChangedListener');

var HEADING_WITHOUT_SCENE_ID_SELECTOR = 'heading:not(.scene-id)';
var LINES_CHANGED_LISTENER_TIMEOUT = 800;
var SCENE_ID_KEY_ATTRIB = shared.SCENE_ID_KEY_ATTRIB;
var SCENE_ID_PREFIX = shared.SCENE_ID_PREFIX;
var SCENE_ID_REGEXP = shared.SCENE_ID_REGEXP;

var sceneUniqueIdTagging = function(editorInfo, documentAttributeManager) {
  var self = this;
  self.editorInfo = editorInfo;
  self.attributeManager = documentAttributeManager;
  linesChangedListener.onLineChanged(
    HEADING_WITHOUT_SCENE_ID_SELECTOR,
    this.markScenesWithUniqueId.bind(this),
    LINES_CHANGED_LISTENER_TIMEOUT
  );
};

sceneUniqueIdTagging.prototype._generateSceneId = function() {
  return SCENE_ID_PREFIX + randomString(16);
};

sceneUniqueIdTagging.prototype._markSceneWithUniqueId = function(element, $lines) {
  var lineNumber = $lines.index(element);
  var sceneId = this._generateSceneId();

  // Not sure if we will encouter race conditions here. Be careful.
  var hasSceneId = this.attributeManager.getAttributeOnLine(lineNumber, SCENE_ID_KEY_ATTRIB);
  if (!hasSceneId) {
    this.attributeManager.setAttributeOnLine(lineNumber, SCENE_ID_KEY_ATTRIB, sceneId);
  }
};

sceneUniqueIdTagging.prototype.markScenesWithUniqueId = function() {
  var self = this;
  self.editorInfo.ace_inCallStackIfNecessary('markScenesWithUniqueId', function() {
    var padInner = utils.getPadInner();
    var $lines = padInner.find('div');
    var $headingsNotMarkedWithSceneId = padInner.find(HEADING_WITHOUT_SCENE_ID_SELECTOR).parent();
    $headingsNotMarkedWithSceneId.each(function(index, element) {
      self._markSceneWithUniqueId(element, $lines);
    });
  });
};

exports.init = function() {
  var editorInfo = this.editorInfo;
  var documentAttributeManager = this.documentAttributeManager;
  return new sceneUniqueIdTagging(editorInfo, documentAttributeManager);
};
