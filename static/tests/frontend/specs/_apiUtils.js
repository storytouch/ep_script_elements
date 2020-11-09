var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.apiUtils = {
  /**** general helper methods to handle API calls ****/
  CHANGE_CARET_ELEMENT_MESSAGE_TYPE: 'dropdown_caret_element_changed',
  DROPDOWN_ELEMENT_CHANGED: 'dropdown_element_changed',
  FORMATTING_BUTTON_PRESSED: 'formatting_button_pressed',
  UPDATE_SCENE_DURATION: 'UPDATE_SCENE_DURATION',
  CHANGE_SM_SET_MESSAGE_TYPE: 'scene_mark_set_element_changed',
  SELECT_NEXT_ELEMENT: 'select_next_element',
  SELECT_PREVIOUS_ELEMENT: 'select_previous_element',
  CHANGE_ELEMENT_TYPE: 'change_element_type',
  DELETE_ELEMENT: 'delete_element',
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
    return (this.lastDataSent[this.CHANGE_SM_SET_MESSAGE_TYPE] || {}).elementType;
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
  /**** SELECT_NEXT_ELEMENT ****/
  /*
    message: {
      type: 'select_next_element'
    }
  */
  simulateTriggerOfSelectNextElement: function() {
    var message = {
      type: this.SELECT_NEXT_ELEMENT,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },
  /**** SELECT_PREVIOUS_ELEMENT ****/
  /*
    message: {
      type: 'select_previous_element'
    }
  */
  simulateTriggerOfSelectPreviousElement: function() {
    var message = {
      type: this.SELECT_PREVIOUS_ELEMENT,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },
  /**** CHANGE_ELEMENT_TYPE ****/
  /*
    message: {
      type: 'change_element_type'
    }
  */
  simulateTriggerOfChangeElementType: function(newElementType) {
    var message = {
      type: this.CHANGE_ELEMENT_TYPE,
      element: newElementType,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },
  /**** DELETE_ELEMENT ****/
  /*
    message: {
      type: 'delete_element'
    }
  */
  simulateTriggerOfDeleteElement: function() {
    var message = {
      type: this.DELETE_ELEMENT,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },
}
