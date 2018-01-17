var _ = require('ep_etherpad-lite/static/js/underscore');
var utils = require('./utils');
var CLASS_OF_STYLES_DISABLED_ON_PASTE = require('ep_script_copy_cut_paste/static/js/utils').CLASS_OF_STYLES_DISABLED_ON_PASTE;

/* build CSS style:
#innerdocbody div:first-of-type episode_name,
#innerdocbody div:first-of-type act_name,
#innerdocbody div:first-of-type sequence_name,
#innerdocbody div:first-of-type action,
#innerdocbody div:first-of-type character,
#innerdocbody div:first-of-type transition,
#innerdocbody div:first-of-type shot {
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
  return '#innerdocbody div:first-of-type ' + element;
}).join(',');

var REMOVE_TOP_MARGIN_OF_ELEMENTS_ON_TOP_OF_SCRIPT = ALL_ELEMENTS_ON_TOP_OF_SCRIPT + '{ margin-top: 0px; }';

exports.init = function() {
  // create styles that need to be disabled when pasting content, to avoid Etherpad to "hang"
  // when pasted content is too large
  var $head = utils.getPadInner().find('head');
  $head.append(`<style class="${CLASS_OF_STYLES_DISABLED_ON_PASTE}">${REMOVE_TOP_MARGIN_OF_ELEMENTS_ON_TOP_OF_SCRIPT}</style>`);
}
