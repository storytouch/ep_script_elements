var shared = require('./shared');

var PAD_TYPE_URL_PARAM = 'padType';
var BACKUP_DOCUMENT_TYPE = shared.BACKUP_DOCUMENT_TYPE;
var SCRIPT_DOCUMENT_TYPE = shared.SCRIPT_DOCUMENT_TYPE;
var TEXT_DOCUMENT_TYPE = shared.TEXT_DOCUMENT_TYPE;

var padType = function() {
  this._cachedPadTypeParam = null;
};

padType.prototype._getPadTypeParam = function() {
  if (!this._cachedPadTypeParam) {
    // caches the pad type to avoid over-processing
    var params = new URL(window.location.href).searchParams;
    var padTypeParam = params.get(PAD_TYPE_URL_PARAM);
    this._cachedPadTypeParam = padTypeParam;
  }
  return this._cachedPadTypeParam;
};

padType.prototype.isScriptDocumentPad = function() {
  var padTypeParam = this._getPadTypeParam();

  // considering null types like ScriptDocument
  // for backward compatibility
  var padTypeIsScriptDocument =
    !padTypeParam ||
    padTypeParam === SCRIPT_DOCUMENT_TYPE ||
    padTypeParam === BACKUP_DOCUMENT_TYPE;

  return padTypeIsScriptDocument;
};

padType.prototype.isTextDocumentPad = function() {
  var padTypeParam = this._getPadTypeParam();
  return padTypeParam === TEXT_DOCUMENT_TYPE;
};

exports.init = function() {
  return new padType();
};
