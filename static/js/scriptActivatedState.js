var utils = require('./utils');
var eascUtils = require('ep_script_toggle_view/static/js/utils');
var eascModeState = require('ep_script_toggle_view/static/js/eascModeState');

exports.init = function() {
  listenToEascChanges();

  // set initial value
  updateScriptActivatedProp(eascModeState.getCurrentEascMode());
}

var listenToEascChanges = function() {
  var $innerDoc = utils.getPadInner().find('#innerdocbody');
  $innerDoc.on(eascUtils.EASC_CHANGED_EVENT, function(e, data) {
    var eascMode = data.eascMode;
    updateScriptActivatedProp(eascMode);
  });
}

var updateScriptActivatedProp = function(eascMode) {
  var isScriptActivated = eascMode.includes(eascUtils.SCRIPT_ELEMENT_TYPE);
  utils.getThisPluginProps().isScriptActivated = isScriptActivated;
}
