var _ = require('ep_etherpad-lite/static/js/underscore');

var tags = ['heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot'];
var sceneTag = ['scene-number', 'scene-duration', 'scene-temporality', 'scene-workstate', 'scene-time'];

var SCENE_DURATION_CLASS_PREFIX = 'sceneDuration-';
var SCENE_DURATION_ATTRIB_NAME = 'sceneDuration';

// from sceneDuration-30 gets '30'
var SCENE_DURATION_REGEXP = new RegExp(SCENE_DURATION_CLASS_PREFIX + '([0-9]+)');

var SCENE_ID_KEY_ATTRIB = 'scene-id';
var SCENE_ID_PREFIX = 'scid-';
var SCENE_ID_REGEXP = new RegExp('(?:^| )' + SCENE_ID_PREFIX + '[A-Za-z0-9]+');

var collectContentPre = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var cls = context.cls || '';

  if(tname === 'div' || tname === 'p'){
    delete lineAttributes['script_element'];
    delete lineAttributes[SCENE_DURATION_ATTRIB_NAME];
  }

  if (isScriptElement(tname)) {
    lineAttributes['script_element'] = tname;

    // collect scene id
    var sceneId = SCENE_ID_REGEXP.exec(context.cls);
    if (sceneId) {
      lineAttributes[SCENE_ID_KEY_ATTRIB] = sceneId[0];
    }

    // collect scene metric
    var sceneDuration = SCENE_DURATION_REGEXP.exec(cls);
    if (sceneDuration) {
      lineAttributes[SCENE_DURATION_ATTRIB_NAME] = sceneDuration[1];
    }
  } else if (isSceneTag(tname)) {
    // scene tag value is stored on element class
    lineAttributes[tname] = context.cls;
  }
};

// I don't even know when this is run..
var collectContentPost = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = _.indexOf(tags, tname);
  if(tagIndex >= 0){
    //take line-attributes used away - script_element and scenesData[]
    //all elements in the tags array uses script_element as key of lineattributes
    var usedLineAttributes = _.union(sceneTag, ['script_element', SCENE_DURATION_ATTRIB_NAME])
    for (var i = 0; i < usedLineAttributes.length ; i++) {
      delete lineAttributes[usedLineAttributes[i]];
    }
  }
};

var isSceneTag = function(tname) {
  return _.indexOf(sceneTag, tname) >= 0;
}
var isScriptElement = function(tname) {
  return _.indexOf(tags, tname) >= 0;
}

exports.collectContentPre = collectContentPre;
exports.collectContentPost = collectContentPost;
exports.tags = tags;
exports.sceneTag = sceneTag;
exports.SCENE_DURATION_ATTRIB_NAME = SCENE_DURATION_ATTRIB_NAME;
exports.SCENE_DURATION_CLASS_PREFIX  = SCENE_DURATION_CLASS_PREFIX;
exports.SCENE_ID_KEY_ATTRIB = SCENE_ID_KEY_ATTRIB;
exports.SCENE_ID_PREFIX = SCENE_ID_PREFIX;
exports.SCENE_ID_REGEXP = SCENE_ID_REGEXP;
