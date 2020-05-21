var shared = require('./shared');

var PAD_TYPE_URL_PARAM = 'padType';
var BACKUP_DOCUMENT_TYPE = shared.BACKUP_DOCUMENT_TYPE;
var SCRIPT_DOCUMENT_TYPE = shared.SCRIPT_DOCUMENT_TYPE;

var padType = function() {
  // I know it is weird, ugly and unsafe, but it is necessary
  // to allow mocking the padType URL parameter in tests.
  //
  // So, if you want to test diferent padType values, assign
  // window._getPadTypeParam = yourMockFunctionThatReturnsAType
  // before creating a pad, as in .setPadType(type)
  // ep_script_elements/static/tests/frontend/specs/_utils.js
  //
  // See an example at:
  // ep_mouse_shortcuts/static/tests/frontend/specs/padType.js
  this.getPadTypeParam = parent._getPadTypeParam || this._getPadTypeParam;
};

padType.prototype._getPadTypeParam = function() {
  var params = new URL(window.location.href).searchParams;
  var padTypeParam = params.get(PAD_TYPE_URL_PARAM);
};

padType.prototype.isScriptDocumentPad = function() {
  var padTypeParam = this.getPadTypeParam();

  // considering null types like ScriptDocument
  // for backward compatibility
  var padTypeIsScriptDocument =
    !padTypeParam ||
    padTypeParam === SCRIPT_DOCUMENT_TYPE ||
    padTypeParam === BACKUP_DOCUMENT_TYPE;

  return padTypeIsScriptDocument;
};

exports.init = function() {
  return new padType();
};
