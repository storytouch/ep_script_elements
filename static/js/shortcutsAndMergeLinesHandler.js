var _ = require('ep_etherpad-lite/static/js/underscore');
var utils = require('./utils');
var shortcuts = require('./shortcuts');
var mergeLines = require('./mergeLines');
var reformatShortcuts = require('./reformatShortcuts');

var KEYS = {
  Z: 90,
};

var shortcutsAndMergeLinesHandler = function() {
  this._handlers = [
    shortcuts,
    mergeLines,
    reformatShortcuts,
  ];
}

shortcutsAndMergeLinesHandler.prototype.handle = function(context) {
  // if reformat window is opened, handle only reformat keys
  if (this._isReformatWindowOpen()) {
    if (this._isUnblockableKey(context)) return false;

    this._runSpecificHandler(reformatShortcuts, context);

    // block any other key
    context.evt.preventDefault()
    var eventProcessed = true;
    return eventProcessed;
  }

  // otherwise, use any available handler
  return this._runAllHandlers(context);
}

shortcutsAndMergeLinesHandler.prototype._runSpecificHandler = function(handler, context) {
  var eventProcessed = false;
  var handlerFunction = handler.findHandlerFor(context);

  if (handlerFunction) {
    eventProcessed = handlerFunction(context);
    if (eventProcessed) {
      context.evt.preventDefault();
    }
  }

  return eventProcessed;
}

shortcutsAndMergeLinesHandler.prototype._runAllHandlers = function(context) {
  var self = this;
  return _.some(this._handlers, function(handler) {
    return self._runSpecificHandler(handler, context);
  });
}

shortcutsAndMergeLinesHandler.prototype._isReformatWindowOpen = function() {
  var thisPlugin = utils.getThisPluginProps();
  return thisPlugin.reformatWindowState.isOpened();
}

shortcutsAndMergeLinesHandler.prototype._isUnblockableKey = function (context) {
  var evt = context.evt;
  return (evt.ctrlKey && evt.keyCode === KEYS.Z); // Ctrl+Z (undo)
}

exports.init = function() {
  return new shortcutsAndMergeLinesHandler();
}
