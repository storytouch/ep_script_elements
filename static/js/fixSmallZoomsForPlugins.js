// This feature is needed because small zooms (<= 67%) do not scale font size the same way it
// scales other elements on the page. This causes a page to fit more than the allowed chars/line on
// elements that have left and/or right margin (character, dialogue, parenthetical, and transition)

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var browser = require('ep_etherpad-lite/static/js/browser');

var utils = require('./utils');
var pasteUtils = require('ep_script_copy_cut_paste/static/js/utils');

// [perf] disable styles while on paste, to make paste of large contents faster
var CLASSES_OF_NEW_PAD_INNER_STYLE_TAG = 'dynamic-styles-on-pad-inner ' + pasteUtils.CLASS_OF_STYLES_DISABLED_ON_PASTE;
var CLASSES_OF_NEW_PAD_OUTER_STYLE_TAG = 'dynamic-styles-on-pad-outer';

// this was calculated using 100% zoom on Chrome
var DEFAULT_CHAR_WIDTH = browser.mac ? 7.2 : 6.6;
var DEFAULT_LINE_HEIGHT = 16.0;
var DEFAULTS = {
  charWidth: DEFAULT_CHAR_WIDTH,
  lineHeight: DEFAULT_LINE_HEIGHT,
}
exports.DEFAULT_CHAR_WIDTH = DEFAULT_CHAR_WIDTH;
exports.DEFAULT_LINE_HEIGHT = DEFAULT_LINE_HEIGHT;

exports.init = function() {
  waitForResizeToFinishThenCall(updateStyles);
}

var padInnerStyleGenerators = [];
var padOuterStyleGenerators = [];

exports.registerStyleGeneratorForNewPadInnerScreenSize = function(styleGenerator) {
  padInnerStyleGenerators.push(styleGenerator);
  // there are new styles to be generated, make sure we have all of them being used
  updateStyles();
}
exports.registerStyleGeneratorForNewPadOuterScreenSize = function(styleGenerator) {
  padOuterStyleGenerators.push(styleGenerator);
  // there are new styles to be generated, make sure we have all of them being used
  updateStyles();
}

var waitForResizeToFinishThenCall = function(callback) {
  var resizeTimer;
  var timeout = 200;
  $(window).on('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(callback, timeout);
  });
}

var updateStyles = function() {
  var newProportions = {
    vertical: calculateVerticalProportion(),
    horizontal: calculateHorizontalProportion(),
  };

  var newPadInnerStyles = _(padInnerStyleGenerators).map(function(generateNewStyle) {
    return generateNewStyle(newProportions, DEFAULTS);
  }).join('\n');
  var newPadOuterStyles = _(padOuterStyleGenerators).map(function(generateNewStyle) {
    return generateNewStyle(newProportions, DEFAULTS);
  }).join('\n');

  // remove old styles
  utils.getPadInner().find('head .' + CLASSES_OF_NEW_PAD_INNER_STYLE_TAG).remove();
  utils.getPadOuter().find('head .' + CLASSES_OF_NEW_PAD_OUTER_STYLE_TAG).remove();
  // add new styles
  utils.getPadInner().find('head').append('<style class="' + CLASSES_OF_NEW_PAD_INNER_STYLE_TAG + '">' + newPadInnerStyles + '</style>');
  utils.getPadOuter().find('head').append('<style class="' + CLASSES_OF_NEW_PAD_OUTER_STYLE_TAG + '">' + newPadOuterStyles + '</style>');
}

var calculateVerticalProportion = function() {
  var oneLineHeight = getHeightOfOneLine();
  return oneLineHeight / DEFAULT_LINE_HEIGHT;
}

var calculateHorizontalProportion = function() {
  var oneCharWidth = getWidthOfOneChar();
  return oneCharWidth / DEFAULT_CHAR_WIDTH;
}

var getWidthOfOneChar = function() {
  return utils.getPadOuter().find('#linemetricsdiv').get(0).getBoundingClientRect().width;
}

var getHeightOfOneLine = function() {
  return utils.getPadOuter().find('#linemetricsdiv').get(0).getBoundingClientRect().height;
}
