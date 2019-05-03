var eejs = require('ep_etherpad-lite/node/eejs/');
var Changeset = require("ep_etherpad-lite/static/js/Changeset");
var Security = require('ep_etherpad-lite/static/js/security');
var Security = require('ep_etherpad-lite/static/js/security');

var sceneMarkUtils  = require("ep_script_scene_marks/utils");

// Define the styles so they are consistant between client and server
var style = eejs.require("ep_script_elements/static/css/editor.css")

var SCENE_LENGTH_NAMESPACE = 'scenesLength';

// Include CSS for HTML export
exports.stylesForExport = function(hook, padId, cb){
  cb(style);
};

exports.getLineHTMLForExport = function (hook, context) {
  var attribLine = context.attribLine;
  var apool = context.apool;
  var hasSceneMark = sceneMarkUtils.findSceneMarkAttribKey(context);

  //if it is a scene mark it is not a script element (including a general)
  if (hasSceneMark) return;

  //try to find a scene line attributes. if it's found it mounts the HTML with it
  var script_element = findAttrib(attribLine, apool, "script_element");
  var text = context.lineContent;
  if (script_element) {
    text = text.substring(1);
  } else { // if it is not a script nor a scene mark, then it is a general
    script_element = "general";
  }

  //these dataAttributes refers do scene attributes like scene-name, scene-number, ...
  var dataAttributes = mountAdditionalSceneData(context);

  //finally, mount the HTML to export
  context.lineContent = `<${script_element}>${dataAttributes}${text}</${script_element}>`;
}

exports.socketio = function(hook, context, cb) {
  context.io
    .of(`/${SCENE_LENGTH_NAMESPACE}`)
    .on('connection', function(socket) {
      socket.on('broadcastSceneLengthChange', function(data) {
        var padId = data.padId;
        var scenesLength = data.scenesLength;

        // join the room
        socket.join(padId);

        // broadcast scenes length to all clients except sender
        socket.broadcast.to(padId).emit('scenesLengthChanged', scenesLength);
      })
    });
}

//attrib is the element key in the pair key-value, scene-name:'whatever', in this case scene-name
function findAttrib(alineAttrs, apool, attrib) {
  var script_element = null;
  if (alineAttrs) {
    var opIter = Changeset.opIterator(alineAttrs);
    if (opIter.hasNext()) {
      var op = opIter.next();
      script_element = Changeset.opAttributeValue(op, attrib, apool);
    }
  }
  return script_element;
}

//check if there's any scene tag as a lineattribute, if so return it formatted
function mountAdditionalSceneData(context) {
  var sceneTag = ["scene-number", "scene-duration", "scene-temporality", "scene-workstate", "scene-index", "scene-time"];
  var dataAttributes = "";
  var sceneDataTags = "";
  for (var i = 0; i < sceneTag.length; i++) {
    var attribute = findAttrib(context.attribLine, context.apool, sceneTag[i]);
    if (attribute){
      dataAttributes += formatTagOutput(sceneTag[i],attribute);
    }
  }
  if (dataAttributes){
    sceneDataTags = "<scene"+dataAttributes+"></scene>";
  }
  return sceneDataTags;
}

//helper to output the sceneTag as tag="value"
function formatTagOutput(key, value) {
  value = Security.escapeHTML(value);
  return  " "+key+"=\""+value+"\"";
}
