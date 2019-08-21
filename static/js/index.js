var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');

var scriptElementTransitionUtils = require('ep_script_element_transitions/static/js/utils');
var pasteUtils                   = require('ep_script_copy_cut_paste/static/js/utils');

var shared                        = require('./shared');
var utils                         = require('./utils');
var SM_AND_HEADING                = _.union(utils.SCENE_MARK_SELECTOR, ['heading']);
var aceEditorCSS                  = require('./aceEditorCSS');
var shortcuts                     = require('./shortcuts');
var mergeLines                    = require('./mergeLines');
var undoPagination                = require('./undoPagination');
var caretElementChange            = require('./caretElementChange');
var preventMultilineDeletion      = require('./doNotAllowEnterAndKeysOnMultilineSelection');
var api                           = require('./api');
var changeElementOnDropdownChange = require('./changeElementOnDropdownChange');
var scheduler                     = require('./scheduler');
var scriptActivatedState          = require('./scriptActivatedState');
var calculateSceneLength          = require('./calculateSceneLength');
var calculateSceneEdgesLength     = require('./calculateSceneEdgesLength');
var sceneDuration                 = require('./sceneDuration');
var scenesLength                  = require('./scenesLength');

var tags = shared.tags;
var sceneTag = shared.sceneTag;

var ace_calculateSceneLength;
var caretElementChangeSchedule, updateSceneLengthSchedule;

var SM_AND_HEADING = _.union(utils.SCENE_MARK_SELECTOR, ['heading']);
var TIME_TO_UPDATE_CARET_ELEMENT = 900;
var TIME_TO_CALCULATE_SCENE_LENGTH = 1200;
var IDLE_WORK_COUNTER_INACTIVITY_THRESHOLD = 2;

var pluginHasInitialized = false;
var isFirstTimeSceneLengthCalculationRunAfterLoading = true;

// 'undo' & 'redo' are triggered by toolbar buttons; other events are triggered by key shortcuts
var UNDO_REDO_EVENTS = ['handleKeyEvent', 'undo', 'redo'];

var CSS_TO_BE_DISABLED_ON_PASTE = aceEditorCSS.CSS_TO_BE_DISABLED_ON_PASTE;

// All our tags are block elements, so we just return them.
exports.aceRegisterBlockElements = function() {
  return _.flatten([undoPagination.UNDO_FIX_TAG, tags]);
}

exports.aceEditEvent = function(hook, context) {
  var callstack  = context.callstack;
  var eventType  = callstack.editEvent.eventType;
  var padHasLoadedCompletely = finishedLoadingPadAndSceneMarkIsInitialized(eventType);

  if (lineWasChangedByShortcut(eventType) || eventMightBeAnUndo(callstack)) {
    caretElementChange.sendMessageCaretElementChanged(context);
  }

  if (updateSceneLengthSchedule) {
    updateSceneLengthSchedule.processAceEditEvent(eventType);
  }

  // when we import a script Etherpad does not trigger any event that makes
  // isAChangeOnPadContent change to true. So to avoid not running the
  // calculation of the scene length, we force run it as soon the pad loads
  if (padHasLoadedCompletely && (isFirstTimeSceneLengthCalculationRunAfterLoading || isAChangeOnPadContent(eventType, callstack) )) {
    isFirstTimeSceneLengthCalculationRunAfterLoading = false;
    updateSceneLengthSchedule.schedule();
  }
}

var finishedLoadingPadAndSceneMarkIsInitialized = function(eventType) {
  return utils.checkIfPadHasLoaded(eventType) && pluginHasInitialized;
}

var isAChangeOnPadContent = function(eventType, callstack) {
  return (callstack.docTextChanged && utils.checkIfPadHasLoaded(eventType)) || isAChangeOnElementType(eventType);
}

var isAChangeOnElementType = function(eventType) {
  return lineWasChangedByShortcut(eventType) ||
         eventType === utils.CHANGE_ELEMENT_EVENT;
}

var lineWasChangedByShortcut = function(eventType) {
  return eventType === scriptElementTransitionUtils.CHANGE_ELEMENT_BY_SHORTCUT_EVENT;
}

var eventMightBeAnUndo = function(callstack) {
  var isAnUndoRedoCandidate = _(UNDO_REDO_EVENTS).contains(callstack.editEvent.eventType);
  return callstack.repChanged && isAnUndoRedoCandidate;
}

exports.postAceInit = function(hook, context) {
  var ace = context.ace;
  var thisPlugin = utils.getThisPluginProps();
  thisPlugin.calculateSceneEdgesLength = calculateSceneEdgesLength.init();
  thisPlugin.scenesLength = scenesLength.init();

  // provide access to other plugins
  thisPlugin.calculateSceneLength = ace_calculateSceneLength();
  thisPlugin.calculateSceneLength.run(true);

  scriptActivatedState.init();
  preventMultilineDeletion.init();
  api.init(ace);

  var caretElementChangeSendMessageBound = function() {
    ace.callWithAce(function(ace) {
      ace.ace_caretElementChangeSendMessage();
    })
  };

  caretElementChangeSchedule = scheduler.init(
    caretElementChangeSendMessageBound,
    TIME_TO_UPDATE_CARET_ELEMENT
  );

  var thisCalculateSceneLength = utils.getThisPluginProps().calculateSceneLength;
  updateSceneLengthSchedule = scheduler.init(
    thisCalculateSceneLength.run.bind(thisCalculateSceneLength),
    TIME_TO_CALCULATE_SCENE_LENGTH,
    IDLE_WORK_COUNTER_INACTIVITY_THRESHOLD
  );

  // expose it to be able to override inner variables on tests
  thisPlugin.updateSceneLengthSchedule = updateSceneLengthSchedule;

  pluginHasInitialized = true;

};

// On caret position change show the current script element
exports.aceSelectionChanged = function(hook, context, cb) {
  var cs = context.callstack;

  // If it's an initial setup event then do nothing
  if (cs.type == 'setBaseText' || cs.type == 'setup' || cs.type == 'importText') return false;

  // when we import a script and load it, some events that changes the selection
  // are triggered and makes this hook runs before the postAceInit to be called.
  // This causes caretElementChangeSchedule being called without being initialized. To avoid
  // it we check if the object has been created. Related to #1417

  if (caretElementChangeSchedule) {
    caretElementChangeSchedule.schedule();
  }
}

exports.aceKeyEvent = function(hook, context) {
  var eventProcessed = false;
  var evt = context.evt;

  var handleShortcut = shortcuts.findHandlerFor(evt);
  var handleMerge    = mergeLines.findHandlerFor(context);

  // Cmd+[ or Cmd+]
  if (handleShortcut) {
    evt.preventDefault();
    handleShortcut(context);
    eventProcessed = true;
  }
  // BACKSPACE or DELETE
  else if (handleMerge) {
    // call function that handles merge
    var mergeShouldBeBlocked = handleMerge;

    // cannot merge lines, so do not process keys
    if (mergeShouldBeBlocked) {
      evt.preventDefault();
      eventProcessed = true;
    }
  }

  return eventProcessed;
}

// Our script element attribute will result in a script_element:heading... :transition class
exports.aceAttribsToClasses = function(hook, context) {
  if (context.key === 'script_element') {
    return [ 'script_element:' + context.value ];
  } else if (context.key === undoPagination.UNDO_FIX_ATTRIB) {
    return [ undoPagination.UNDO_FIX_ATTRIB ];
  } else if (context.key === shared.SCENE_DURATION_ATTRIB_NAME)  {
    return [ shared.SCENE_DURATION_ATTRIB_NAME + ':' + context.value ]; // e.g. sceneDuration:60
  }
}

exports.aceDomLineProcessLineAttributes = function(name, context) {
  var cls = context.cls;

  var lineModifier = processScriptElementAttribute(cls);
  if (lineModifier.length === 0) {
    lineModifier = processUndoFixAttribute(cls);
  }

  return lineModifier;
};

exports.acePostWriteDomLineHTML = function(hook, context) {
  var $line = $(context.node);
  var extraFlag = findExtraFlagForLine($line);
  if (extraFlag) {
    $line.addClass(extraFlag);
  }
}

var findExtraFlagForLine = function($node) {
  var sceneMarkTagIndex = -1;

  _.each(SM_AND_HEADING, function(tag) {
    var nodeHasTag = $node.find(tag).length;
    if (nodeHasTag) {
      sceneMarkTagIndex = _.indexOf(SM_AND_HEADING, tag);
      return; // found flagIndex, can stop each()
    }
  });

  return utils.SCENE_MARK_TYPE[sceneMarkTagIndex];
}

// Here we convert the class script_element:heading into a tag
var processScriptElementAttribute = function(cls) {
  var scriptElementType = /(?:^| )script_element:([A-Za-z0-9]*)/.exec(cls);
  var sceneDurationInSeconds = /(?:^| )sceneDuration:([0-9 \/]+)/.exec(cls);
  var tagIndex;

  if (scriptElementType) tagIndex = _.indexOf(tags, scriptElementType[1]);

  if (tagIndex !== undefined && tagIndex >= 0) {
    var tag = tags[tagIndex];
    var modifier = {
      preHtml: '<' + tag + buildSceneMetricClass(sceneDurationInSeconds) + '>',
      postHtml: '</' + tag + '>',
      processedMarker: true
    };
    return [modifier];
  }

  return [];
}

// we only add this class on headings
var buildSceneMetricClass = function(sceneDurationInSeconds) {
  var sceneMetricClass = '';
  if (sceneDurationInSeconds) {
    var sceneDurationClass = sceneDurationInSeconds ? shared.SCENE_DURATION_CLASS_PREFIX + sceneDurationInSeconds[1] : '';
    sceneMetricClass = ` class="${sceneDurationClass}"`
  }
  return sceneMetricClass;
}

var processUndoFixAttribute = function(cls) {
  if (cls.includes(undoPagination.UNDO_FIX_ATTRIB)) {
    var tag = undoPagination.UNDO_FIX_TAG;
    var modifier = {
      preHtml: '<' + tag + '>',
      postHtml: '</' + tag + '>',
      processedMarker: true
    };
    return [modifier];
  }

  return [];
}

// Once ace is initialized, we set ace_doInsertScriptElement and bind it to the context
// and we set ace_removeSceneTagFromSelection and bind it to the context
exports.aceInitialized = function(hook, context) {
  var editorInfo = context.editorInfo;

  editorInfo.ace_removeSceneTagFromSelection = _(removeSceneTagFromSelection).bind(context);
  editorInfo.ace_doInsertScriptElement = _(changeElementOnDropdownChange.doInsertScriptElement).bind(context);
  ace_calculateSceneLength = _(calculateSceneLength.init).bind(context);
  editorInfo.ace_addSceneDurationAttribute = _(sceneDuration.addSceneDurationAttribute).bind(context);
  editorInfo.ace_caretElementChangeSendMessage = _(caretElementChange.sendMessageCaretElementChanged).bind(context);

  pasteUtils.markStylesToBeDisabledOnPaste(CSS_TO_BE_DISABLED_ON_PASTE);
}

// Find out which lines are selected and remove scenetag from them
function removeSceneTagFromSelection() {
  var rep = this.rep;
  var documentAttributeManager = this.documentAttributeManager;
  if (!(rep.selStart && rep.selEnd)) {
    return;
  }

  var firstLine = rep.selStart[0];
  var lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));

  _(_.range(firstLine, lastLine + 1)).each(function(line) { // for each line on selected range
    _.each(sceneTag, function(attribute) { // for each scene mark attribute
      documentAttributeManager.removeAttributeOnLine(line, attribute);
    });
  });

}
