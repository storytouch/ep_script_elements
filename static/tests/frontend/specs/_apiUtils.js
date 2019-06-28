var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.apiUtils = {
  /**** general helper methods to handle API calls ****/
  CHANGE_CARET_ELEMENT_MESSAGE_TYPE: 'dropdown_caret_element_changed',
  DROPDOWN_ELEMENT_CHANGED: 'dropdown_element_changed',
  FORMATTING_BUTTON_PRESSED: 'formatting_button_pressed',
  UPDATE_SCENE_DURATION: 'UPDATE_SCENE_DURATION',
  CHANGE_SM_SET_MESSAGE_TYPE: 'scene_mark_set_element_changed',
  lastDataSent: {},

  startListeningToApiEvents: function() {
    var self = this;
    var outboundApiEventsTarget = helper.padChrome$.window.parent;

    outboundApiEventsTarget.addEventListener('message', function(e) {
      self.lastDataSent[e.data.type] = e.data;
    });
  },

  waitForDataToBeSent: function(eventType, done) {
    var self = this;
    helper.waitFor(function() {
      return self.lastDataSent[eventType];
    }, 2000).done(done);
  },

  resetLastDataSent: function() {
    this.lastDataSent = {}
  },

  getLastSMSetElementChange: function() {
    var elementType;
    var lastMessageSent = this.lastDataSent[this.CHANGE_SM_SET_MESSAGE_TYPE];
    if (lastMessageSent) {
      elementType = lastMessageSent.elementType;
    }
    return elementType;
  },

  getLastCaretElementChange: function() {
    var elementType;
    var lastMessageSent = this.lastDataSent[this.CHANGE_CARET_ELEMENT_MESSAGE_TYPE];
    if (lastMessageSent) {
      elementType = lastMessageSent.elementType;
    }
    return elementType;
  },

  waitForApiToSend: function(valueToBeSent, done) {
    var self = this;
    helper.waitFor(function() {
      var elementSentToApi = self.getLastCaretElementChange();
      return elementSentToApi === valueToBeSent;
    }, 4000).done(done);
  },

  // **** DROPDOWN_ELEMENT_CHANGED ****/
  /*
    message: {
      type: 'dropdown_element_changed',
      element: 'action'
     }
  */
  simulateTriggerOfDropdownChanged: function(element) {
    var message = {
      type: this.DROPDOWN_ELEMENT_CHANGED,
      element: element,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },

  simulateTriggerOfFormattingButtonChanged: function(buttonName) {
    var message = {
      type: this.FORMATTING_BUTTON_PRESSED,
      buttonName: buttonName,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },
  /**** UPDATE_SCENE_DURATION ****/
  /*
    message: {
      type: 'UPDATE_SCENE_DURATION'
      duration: '2',
      scene: { ..., lineId: "magicdomid9", ... },
    }
  */
  simulateTriggerOfUpdateOfSceneDuration: function(sceneDuration, sceneId) {
    var message = {
      type: this.UPDATE_SCENE_DURATION,
      duration: sceneDuration,
      scene: {
        lineId: sceneId,
      },
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },
}
