var _ = require('ep_etherpad-lite/static/js/underscore');
var shortcuts = require('./shortcuts');
var mergeLines = require('./mergeLines');

var shortcutsAndMergeLinesHandler = function() {
  this._handlers = [
    shortcuts,
    mergeLines,
  ];
}

shortcutsAndMergeLinesHandler.prototype.handle = function(context) {
  var self = this;
  var eventProcessed = false;

  return _.some(this._handlers, function(handler) {
    var handlerFunction = handler.findHandlerFor(context);

    if (handlerFunction) {
      context.evt.preventDefault();
      eventProcessed = handlerFunction(context);
    }

    return eventProcessed;
  });
}

exports.init = function() {
  return new shortcutsAndMergeLinesHandler();
}
