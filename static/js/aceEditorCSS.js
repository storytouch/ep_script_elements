exports.CSS_TO_BE_DISABLED_ON_PASTE = 'ep_script_elements/static/css/disable_on_paste.css';

exports.aceEditorCSS = function() {
  return [
    'ep_script_elements/static/css/editor.css',
  ];
}

exports.disableOnPaste = function() {
  return [
    exports.CSS_TO_BE_DISABLED_ON_PASTE,
  ];
}
