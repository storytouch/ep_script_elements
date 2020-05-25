var utils                         = require('./utils');
var padType                       = require('./padType');

// this hook proxies the functionality of jQuery's $(document).ready event
exports.documentReady = function() {
  var thisPlugin = utils.getThisPluginProps();
  thisPlugin.padType = padType.init();
}
