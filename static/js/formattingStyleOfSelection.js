exports.clickButton = function(formattingButton) {
  $('[data-key="'+ formattingButton + '"]').click();
}

// toggle strikethrough on current selection
exports.applyStrikethrough = function(context) {
  var editorInfo = context.editorInfo;
  editorInfo.ace_inCallStackIfNecessary('applyStrikethroughViaUserCommand', function() {
    editorInfo.ace_toggleAttributeOnSelection('strikethrough');
  });
}
