var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');

var scriptElementTransitionUtils = require('ep_script_element_transitions/static/js/utils');
var pasteUtils                   = require('ep_script_copy_cut_paste/static/js/utils');

var shared                        = require('./shared');
var utils                         = require('./utils');
var SM_AND_HEADING                = _.union(utils.SCENE_MARK_SELECTOR, ['heading']);
var aceEditorCSS                  = require('./aceEditorCSS');
var undoPagination                = require('./undoPagination');
var caretElementChange            = require('./caretElementChange');
var preventMultilineDeletion      = require('./doNotAllowEnterAndKeysOnMultilineSelection');
var api                           = require('./api');
var changeElementOnDropdownChange = require('./changeElementOnDropdownChange');
var scheduler                     = require('./scheduler');
var scriptActivatedState          = require('./scriptActivatedState');
var calculateSceneLength          = require('./calculateSceneLength');
var sceneDuration                 = require('./sceneDuration');
var scenesLength                  = require('./scenesLength');
var sceneUniqueIdTagging          = require('./scenesUniqueIdTagging');
var elementContentSelector        = require('./elementContentSelector');
var elementContentCleaner         = require('./elementContentCleaner');
var shortcutsAndMergeLinesHandler = require('./shortcutsAndMergeLinesHandler');
var reformatWindowState           = require('./reformatWindowState');
var reformatShortcutHandler       = require('./reformatShortcutHandler');

var tags = shared.tags;
var sceneTag = shared.sceneTag;

var ace_calculateSceneLength;
var caretElementChangeSchedule;

var SM_AND_HEADING = _.union(utils.SCENE_MARK_SELECTOR, ['heading']);
var TIME_TO_UPDATE_CARET_ELEMENT = 900;

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

  // when we import a script Etherpad does not trigger any event that makes
  // isAChangeOnPadContent change to true. So to avoid not running the
  // calculation of the scene length, we force run it as soon the pad loads
  if (padHasLoadedCompletely && (isFirstTimeSceneLengthCalculationRunAfterLoading || isAChangeOnPadContent(eventType, callstack) )) {
    isFirstTimeSceneLengthCalculationRunAfterLoading = false;

    // mark scenes ids after loading script
    utils.getThisPluginProps().sceneUniqueIdTagging.markScenesWithUniqueId();
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

  // provide access to other plugins
  thisPlugin.scenesLength = scenesLength.init();
  thisPlugin.sceneUniqueIdTagging = ace_sceneUniqueIdTagging();
  thisPlugin.calculateSceneLength = ace_calculateSceneLength();
  thisPlugin.reformatShortcutHandler = reformatShortcutHandler.init(ace);

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
  // handles key events only in ScriptDocument pads
  var thisPlugin = utils.getThisPluginProps();
  var isScriptDocumentPad = thisPlugin.padType.isScriptDocumentPad();
  if (!isScriptDocumentPad) return false;

  return thisPlugin.shortcutsAndMergeLinesHandler.handle(context);
}

// Our script element attribute will result in a script_element:heading... :transition class
exports.aceAttribsToClasses = function(hook, context) {
  if (context.key === 'script_element') {
    return [ 'script_element:' + context.value ];
  } else if (context.key === undoPagination.UNDO_FIX_ATTRIB) {
    return [ undoPagination.UNDO_FIX_ATTRIB ];
  } else if (context.key === shared.SCENE_DURATION_ATTRIB_NAME)  {
    return [ shared.SCENE_DURATION_ATTRIB_NAME + ':' + context.value ]; // e.g. sceneDuration:60
  } else if (context.key === shared.SCENE_ID_KEY_ATTRIB)  {
    return [ shared.SCENE_DURATION_ATTRIB_NAME, context.value ];
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
  var tagIndex;

  if (scriptElementType) tagIndex = _.indexOf(tags, scriptElementType[1]);

  if (tagIndex !== undefined && tagIndex >= 0) {
    var tag = tags[tagIndex];
    var modifier = {
      preHtml: '<' + tag + buildScriptElementClasses(cls) + '>',
      postHtml: '</' + tag + '>',
      processedMarker: true,
    };
    return [modifier];
  }

  return [];
};

var buildScriptElementClasses = function(cls) {
  var classes = [];

  // sceneId
  var sceneId = shared.SCENE_ID_REGEXP.exec(cls);
  if (sceneId) {
    var sceneIdClass = shared.SCENE_ID_KEY_ATTRIB + sceneId[0];
    classes.push(sceneIdClass);
  }

  // scene duration
  var sceneDurationInSeconds = /(?:^| )sceneDuration:([0-9 \/]+)/.exec(cls);
  if (sceneDurationInSeconds) {
    var sceneDurationClass = sceneDurationInSeconds
      ? shared.SCENE_DURATION_CLASS_PREFIX + sceneDurationInSeconds[1]
      : '';
    classes.push(sceneDurationClass);
  }

  return classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
};

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
  var rep = context.rep;
  var documentAttributeManager = context.documentAttributeManager;
  var thisPlugin = utils.getThisPluginProps();

  ace_calculateSceneLength = _(calculateSceneLength.init).bind(context);
  ace_sceneUniqueIdTagging = _(sceneUniqueIdTagging.init).bind(context);
  editorInfo.ace_removeSceneTagFromSelection = _(removeSceneTagFromSelection).bind(context);
  editorInfo.ace_doInsertScriptElement = _(changeElementOnDropdownChange.doInsertScriptElement).bind(context);
  editorInfo.ace_addSceneDurationAttribute = _(sceneDuration.addSceneDurationAttribute).bind(context);
  editorInfo.ace_caretElementChangeSendMessage = _(caretElementChange.sendMessageCaretElementChanged).bind(context);
  thisPlugin.elementContentSelector = elementContentSelector.init(editorInfo, rep);
  thisPlugin.elementContentCleaner = elementContentCleaner.init(editorInfo, rep, documentAttributeManager);
  thisPlugin.shortcutsAndMergeLinesHandler = shortcutsAndMergeLinesHandler.init();
  thisPlugin.reformatWindowState = reformatWindowState.init();

  pasteUtils.markStylesToBeDisabledOnPaste(CSS_TO_BE_DISABLED_ON_PASTE);

  // adds a class on the inner iframe with the pad type
  var padTypeParam = thisPlugin.padType.getPadTypeParam();
  if (padTypeParam) {
    utils.getPadInner().find('#innerdocbody').addClass(padTypeParam);
    utils.getPadOuter().find('#outerdocbody').addClass(padTypeParam);
  }
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
