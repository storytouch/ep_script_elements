var _ = require('ep_etherpad-lite/static/js/underscore');
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

exports.init = function() {
  return new shortcutsAndMergeLinesHandler();
}
