var _ = require('ep_etherpad-lite/static/js/underscore');
var fixSmallZoomsForPlugins = require('./fixSmallZoomsForPlugins');

var DEFAULT_LINE_HEIGHT = fixSmallZoomsForPlugins.DEFAULT_LINE_HEIGHT;

var ELEMENTS_WITH_MARGINS = [
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "shot",
];

var DEFAULT_MARGINS = {
  // these values were originally set on CSS
  "shot":          { vertical: { top: 2*DEFAULT_LINE_HEIGHT } },
  "action":        { vertical: { top: 1*DEFAULT_LINE_HEIGHT } },
  "character":     { vertical: { top: 1*DEFAULT_LINE_HEIGHT },
                     horizontal: { left: 152, right: 16  } },
  "transition":    { vertical: { top: 1*DEFAULT_LINE_HEIGHT },
                     horizontal: { left: 290, right: 36  } },
  "parenthetical": { horizontal: { left: 105, right: 154 } },
  "dialogue":      { horizontal: { left: 77,  right: 111 } },
};
exports.DEFAULT_MARGINS = DEFAULT_MARGINS;

/* build this CSS style:
#innerdocbody > div:first-of-type episode_name,
#innerdocbody > div:first-of-type act_name,
#innerdocbody > div:first-of-type sequence_name,
#innerdocbody > div:first-of-type action,
#innerdocbody > div:first-of-type character,
#innerdocbody > div:first-of-type transition,
#innerdocbody > div:first-of-type shot {
  margin-top: 0px;
}
*/
var ALL_ELEMENTS_ON_TOP_OF_SCRIPT = _([
  'episode_name',
  'act_name',
  'sequence_name',
  'action',
  'character',
  'transition',
  'shot',
]).map(function(element) {
  return '#innerdocbody > div:first-of-type ' + element;
}).join(',');

var REMOVE_TOP_MARGIN_OF_ELEMENTS_ON_TOP_OF_SCRIPT = ALL_ELEMENTS_ON_TOP_OF_SCRIPT + '{ margin-top: 0px; }';

exports.init = function() {
  fixSmallZoomsForPlugins.registerStyleGeneratorForNewPadInnerScreenSize(getNewStyles);
}

var getNewStyles = function(newProportions, defaults) {
  var elementStyles = _.map(ELEMENTS_WITH_MARGINS, function(elementName) {
    var elementStyle = getNewStyleForElement(elementName, newProportions);
    return elementStyle;
  }).join("\n");

  // we don't want to affect mobile screens
  var newStyles = "@media (min-width : 464px) { " + elementStyles + " }\n";

  newStyles += REMOVE_TOP_MARGIN_OF_ELEMENTS_ON_TOP_OF_SCRIPT;
  return newStyles;
}

var getNewStyleForElement = function(elementName, newProportions) {
  var defaultMargins = DEFAULT_MARGINS[elementName];

  var marginLeft  = getMarginStyle("left" , defaultMargins.horizontal, newProportions.horizontal);
  var marginRight = getMarginStyle("right", defaultMargins.horizontal, newProportions.horizontal);
  var marginTop   = getMarginStyle("top"  , defaultMargins.vertical  , newProportions.vertical);

  var elementStyle = elementName + " { " + marginLeft + marginRight + marginTop + " }";

  return elementStyle;
}

var getMarginStyle = function(marginName, defaultValues, proportion) {
  // if there's no default value, return an empty string
  var marginStyle = "";

  if (defaultValues && defaultValues[marginName]) {
    var newMargingValue = proportion * defaultValues[marginName];
    marginStyle = "margin-" + marginName + ": " + newMargingValue + "px; ";
  }

  return marginStyle;
}
