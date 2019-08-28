describe('preAceKeyEvent - process ctrl - h as backspace', function() {
  var utils, helperFunctions;

  before(function(cb) {
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.preAceKeyEvent;

    helper.newPad(function(){
      helperFunctions.createScript(cb);
    });
    this.timeout(10000);
  });

  context('when script has more than one scene', function() {
    var FIRST_SCENE = 2;
    beforeEach(function(cb) {
      utils.placeCaretOnLine(FIRST_SCENE, cb);
    });

    context('when user presses H', function() {
      it('does not process as a remove key', function(done) {
        var currentLinesLength = helper.padInner$('div').length;
        helperFunctions.pressHKey();
        helper.waitFor(function(){
          var linesLength = helper.padInner$('div').length;
          return linesLength !== currentLinesLength;
        }).done(function() {
          expect().fail(function(){
            return 'it should not work as backspace';
          })
        }).fail(function() {
          done();
        });
      });
    });

    context('when user presses ctrl-H', function() {
      after(function() {
        utils.undo();
      })

      it('processes as a remove key', function(done) {
        var currentLinesLength = helper.padInner$('div').length;
        helperFunctions.pressCtrlHKey();
        helper.waitFor(function(){
          var linesLength = helper.padInner$('div').length;
          return linesLength !== currentLinesLength;
        }).done(done);
      });
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.preAceKeyEvent = {
  H_KEYCODE: 72,
  utils: function() {
    return ep_script_elements_test_helper.utils;
  },
  createScript: function(cb) {
    var lastText = 'action';
    var utils = this.utils();
    var scene = utils.synopsis() + utils.heading('</br>') + utils.action(lastText);
    utils.createScriptWith(scene, lastText, cb);
  },
  pressHKey: function() {
    this.utils().pressKey(this.H_KEYCODE)
  },
  pressCtrlHKey: function() {
    var pressCtrl = function(e) { e.ctrl = true };
    this.utils().pressKey(this.H_KEYCODE, pressCtrl);
  },
};
