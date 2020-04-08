var utils = require("./utils");

// mac has different keycodes in the 'cmd + []' from windows and linux
var TO_NEXT_SCENE = browser.mac ? 221 : 220;
var TO_PREVIOUS_SCENE = browser.mac ? 219 : 221;

// Setup handlers for shortcuts
var SHORTCUT_HANDLERS = {};
// Cmd+]
SHORTCUT_HANDLERS[TO_NEXT_SCENE] = function(context) {
  moveCaretToAdjacentScene(context, forward);
};
// Cmd+[
SHORTCUT_HANDLERS[TO_PREVIOUS_SCENE] = function(context) {
  moveCaretToAdjacentScene(context, backward);
};

exports.findHandlerFor = function(evt) {
  var type               = evt.type;
  var isTypeForCmdKey    = ((browser.msie || browser.safari || browser.chrome) ? (type == "keydown") : (type == "keypress"));
  // Cmd was pressed?
  var shortcutWasPressed = (isTypeForCmdKey && (evt.metaKey || evt.ctrlKey));

  if (shortcutWasPressed) {
    return SHORTCUT_HANDLERS[evt.keyCode];
  }
}

function moveCaretToAdjacentScene(context, findSceneHeading) {
  var rep              = context.rep;
  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;

  // hack: sometimes Etherpad takes a while to update editorInfo with the selection
  // user made on browser, so we need to make sure editorInfo is up to date before
  // checking if it has some text selected. If we don't do this here and user quickly
  // selects some text and type a shortcut, the text selection won't be noticed and
  // shortcut processing will have weird behaviors
  synchronizeEditorWithUserSelection(editorInfo);

  // search for target scene
  var targetScene = findSceneHeading(rep, attributeManager);

  if (targetScene !== undefined) {
    // found one, can move caret to it
    utils.placeCaretOnLine(editorInfo, [targetScene, 0]);

    // scroll screen so targetScene is on top of the screen
    scrollToLine(targetScene, rep);
  }
}

function synchronizeEditorWithUserSelection(editorInfo) {
  editorInfo.ace_fastIncorp();
}

function scrollToLine(lineNumber, rep) {
  // Set the top of the form to be the same Y as the target Rep
  var y = getYofLine(lineNumber, rep);
  utils.getPadOuter().find('#outerdocbody').parent().scrollTop(y);
}

function getYofLine(lineNumber, rep) {
  var line        = rep.lines.atIndex(lineNumber);
  var key         = "#"+line.key;
  var lineElement = utils.getPadInner().find(key);
  var yOfLine     = lineElement[0].offsetTop;

  return yOfLine;
}

// Strategy to look for target scene. Returns the next scene heading, or undefined if
// current line is after the last scene heading of the script
function forward(rep, attributeManager) {
  var currentLine = rep.selStart[0];
  var totalLines = rep.lines.length();

  // loop through next lines to find on which line is the next scene heading
  for (var lineNumber = currentLine+1; lineNumber < totalLines; lineNumber++) {
    if (utils.lineIsHeading(lineNumber, attributeManager)) {
      return lineNumber;
    }
  }
}

// Strategy to look for target scene. Returns the previous scene heading, or undefined if
// current line is before the first scene heading of the script
function backward(rep, attributeManager) {
  var currentLine = rep.selStart[0];

  // loop through previous lines to find on which line is the previous scene heading
  for (var lineNumber = currentLine-1; lineNumber >= 0; lineNumber--) {
    if (utils.lineIsHeading(lineNumber, attributeManager)) {
      return lineNumber;
    }
  }
}
