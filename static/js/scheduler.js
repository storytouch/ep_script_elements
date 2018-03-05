var scheduler = function() {}

scheduler.prototype.schedule = function(callback, time) {
  this.cancel();
  this.timeoutID = setTimeout(callback, time);
}

scheduler.prototype.cancel = function() {
  clearTimeout(this.timeoutID);
  delete this.timeoutID;
}

exports.init = function() {
  return new scheduler()
}
