var _ = require('ep_etherpad-lite/static/js/underscore');
var utils = require('./utils');
var shortcuts = require('./shortcuts');
var mergeLines = require('./mergeLines');
var reformatShortcuts = require('./reformatShortcuts');

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
    return this._findInReformatHandlers(context);
  }

  // otherwise, use any available handler
  return this._findInAllHanlders(context);
}

shortcutsAndMergeLinesHandler.prototype._findInReformatHandlers = function(context) {
  var eventProcessed = true;
  var handlerFunction = reformatShortcuts.findHandlerFor(context);

  // process reformat keys
  if (handlerFunction) {
    eventProcessed = handlerFunction(context);
    if (eventProcessed) {
      context.evt.preventDefault();
    }
  } else {
    // block any other key
    context.evt.preventDefault();
  }

  return eventProcessed;
}

shortcutsAndMergeLinesHandler.prototype._findInAllHanlders = function(context) {
  var self = this;
  var eventProcessed = false;

  return _.some(this._handlers, function(handler) {
    var handlerFunction = handler.findHandlerFor(context);

    if (handlerFunction) {
      eventProcessed = handlerFunction(context);
      if (eventProcessed) {
        context.evt.preventDefault();
      }
    }

    return eventProcessed;
  });
}

shortcutsAndMergeLinesHandler.prototype._isReformatWindowOpen = function() {
  var thisPlugin = utils.getThisPluginProps();
  return thisPlugin.reformatWindowState.isOpened();
}

exports.init = function() {
  return new shortcutsAndMergeLinesHandler();
}
