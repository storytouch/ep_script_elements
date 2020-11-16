var reformatWindowState = function() {
  this._isOpened = false;
}

reformatWindowState.prototype.setToOpened = function() {
  this._isOpened = true;
}


reformatWindowState.prototype.setToClosed = function() {
  this._isOpened = false;
}

reformatWindowState.prototype.isOpened = function() {
  return this._isOpened;
}

exports.init = function() {
  return new reformatWindowState();
}
