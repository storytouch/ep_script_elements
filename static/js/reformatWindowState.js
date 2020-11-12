var reformatWindowState = function() {
  this._isOpened = false;
}

reformatWindowState.prototype.setToOpened = function() {
  this._isOpened = true;
  //editorInfo.ace_setEditable(editable);
}


reformatWindowState.prototype.setToClosed = function() {
  this._isOpened = false;
  //editorInfo.ace_setEditable(editable);
}

reformatWindowState.prototype.isOpened = function() {
  return this._isOpened;
}

exports.init = function() {
  return new reformatWindowState();
}
