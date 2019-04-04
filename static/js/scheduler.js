var IDLE_WORK_TIMER_EVENT = 'idleWorkTimer';

// callback (function) (required) - function that should be scheduled
// timeout (integer) (required) - interval to wait to execute a function
// idleWorkCounterInactivityThreshold (integer) (optional) - quantity of
// consecutives 'idleWorkTimer' events that considers the editor as idle
var scheduler = function(callback, timeout, idleWorkCounterInactivityThreshold) {
  this._idleEventCounter = 0;
  this._hasScheduleTasksToRun = false;
  this._callback = callback;
  this._timeout = timeout;
  this._idleWorkCounterInactivityThreshold = idleWorkCounterInactivityThreshold;
}

scheduler.prototype.schedule = function() {
  this._cancel();
  var self = this;
  this._hasScheduleTasksToRun = true;
  this.timeoutID = setTimeout(function() {
    self._callback();
    self._resetIdleCounter();
    self._hasScheduleTasksToRun = false;
  }, this._timeout);
}

scheduler.prototype._cancel = function() {
  clearTimeout(this.timeoutID);
  delete this.timeoutID;
}

scheduler.prototype._resetIdleCounter = function() {
  this._idleEventCounter = 0;
}

scheduler.prototype.processAceEditEvent = function(eventType) {
  if (eventType === IDLE_WORK_TIMER_EVENT) {
    this._idleEventCounter++;
  } else {
    this._resetIdleCounter();
  }
  this._rescheduleIfNecessary();
}

scheduler.prototype._isEditorNotIdle = function() {
  return this._idleEventCounter < this._idleWorkCounterInactivityThreshold;
}

scheduler.prototype._rescheduleIfNecessary = function() {
  if (this._hasScheduleTasksToRun && this._isEditorNotIdle()) this.schedule();
}

exports.init = function(callback, timeout, idleWorkCounterInactivityThreshold) {
  return new scheduler(callback, timeout, idleWorkCounterInactivityThreshold);
}
