var _ = require('ep_etherpad-lite/static/js/underscore');
var utils = require('./utils');
var epCommentUtils = require('ep_comments_page/static/js/utils');
var SCENES_LENGTH_NAMESPACE = 'scenesLength';

var scenesLength = function() {
  this._scenesLength = [];
  this.socket = epCommentUtils.openSocketConnectionToRoute(`/${SCENES_LENGTH_NAMESPACE}`);
  this.thisPlugin = utils.getThisPluginProps();
  this.listenToSceneLengthChangeEvent();
}

scenesLength.prototype.listenToSceneLengthChangeEvent = function() {
  var self = this;
  this.socket.on('scenesLengthChanged', function(scenesLength) {
    var scriptElementsAreVisible = self.thisPlugin.isScriptActivated;
    if (!scriptElementsAreVisible) {
      // when a client gets the scenes length data from other user we don't
      // reemit the data
      self.setScenesLength(scenesLength, false);
    }
  })
}

scenesLength.prototype.setScenesLength = function(scenesLength, broadcastChangeToClients) {
  var hasScenesLengthChanged = this._scenesLengthHasChanged(scenesLength);
  if (hasScenesLengthChanged) {
    this._scenesLength = scenesLength;
    this._triggerMessageThatScriptLengthHasChanged();

    if (broadcastChangeToClients) {
      var scenesLengthData = {
        padId: clientVars.padId,
        scenesLength: scenesLength
      }
      this.socket.emit('broadcastSceneLengthChange', scenesLengthData);
    }
  }
}

scenesLength.prototype.getSceneLengthOfHeading = function(element) {
  // don't do any calculation if scene length is not calculated yet!
  if (this._scenesLength.length === 0) return 0;

  var elementIndex = this._getIndexOfElement(element);
  return this._scenesLength[elementIndex];
}

// we have to send the forceNavigatorUpdate equals to true to force the
// navigator to be updated
scenesLength.prototype._triggerMessageThatScriptLengthHasChanged = function() {
  var $innerDoc = utils.getPadInner().find('#innerdocbody');
  $innerDoc.trigger(utils.SCRIPT_LENGTH_CHANGED, {forceNavigatorUpdate: true})
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
