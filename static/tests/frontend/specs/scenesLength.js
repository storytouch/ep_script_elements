describe('ep_script_elements - scenes length', function() {
  var utils = ep_script_elements_test_helper.utils;
  var LAST_HEADING_LINE = 5;
  var SCRIPT_LENGTH_CHANGED = 'script_length_changed';
  var TOLERANCE = 1;
  var scriptLengthChangedEvent;
  var scriptLengthEventData;

  var waitToBuildScenesLengthObj = function(cb) {
    helper.waitFor(function() {
      var scenesLength = getScenesLength();
      var hasBuiltScenesLengthObject = scenesLength[0] > 0;
      return hasBuiltScenesLengthObject;
    }, 4000).done(cb);
  }

  var getScenesLength = function() {
    var headings = helper.padInner$('heading');
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_script_elements;
    var scenesLength = thisPlugin.scenesLength;
    return _.map(headings, function(heading) {
      return scenesLength.getSceneLengthOfHeading(heading);
    });
  }

  var getLineDefaultSize = function() {
    return helper.padOuter$('#linemetricsdiv').get(0).getBoundingClientRect().height;
  }

  var listenToEventScriptLengthChanged = function() {
    // use same jQuery instance that triggers the event
    var $editor = helper.padInner$('#innerdocbody');
    helper.padChrome$($editor.get(0)).on(SCRIPT_LENGTH_CHANGED, function(e, data) {
      scriptLengthChangedEvent = true;
      scriptLengthEventData = data;
    });
  }

  var resetEventData = function() {
    scriptLengthChangedEvent = false;
    scriptLengthEventData = {};
  }

  before(function(done) {
    var lastElement = 'last heading';
    utils.newPad(function(){
      var lastSceneTitle = 'last scene';
      var createScene = function(text) { return utils.synopsis(text) + utils.heading(text)}
      var script = createScene('scene') + createScene(lastSceneTitle);
      utils.createScriptWith(script, lastSceneTitle, function() {
        listenToEventScriptLengthChanged();
        waitToBuildScenesLengthObj(done);
      });
    });
    this.timeout(20000);
  });

  it('saves the scenes length', function(done) {
    var scenesLength = getScenesLength();
    var lineDefaultSize = getLineDefaultSize();
    expect(scenesLength[0]).to.be(lineDefaultSize * 3);
    expect(scenesLength[1]).to.be(lineDefaultSize * 3);
    done();
  });

  context('when an edition does not change the scene length', function() {
    var originalSceneLength;
    before(function(done) {
      resetEventData();
      originalSceneLength = getScenesLength();
      var $lastHeading = helper.padInner$('heading').last();
      $lastHeading.sendkeys('{selectall}{rightarrow}EDITED');
      setTimeout(function() {
        done();
      }, 4000)
      this.timeout(6000);
    });

    after(function() {
      utils.undo();
    });

    it('does not change the scenes length object', function(done) {
      var scenesLength = getScenesLength();
      expect(originalSceneLength[0]).to.be(scenesLength[0]);
      expect(originalSceneLength[1]).to.be(scenesLength[1]);
      expect(originalSceneLength.length).to.be(scenesLength.length);
      done();
    });

    it('does not trigger the scenes length change event', function(done) {
      expect(scriptLengthChangedEvent).to.be(false);
      expect(scriptLengthEventData).to.be.empty();
      done();
    });
  });

  context('when scene length changes', function() {
    before(function(done) {
      resetEventData();
      utils.changeToElement(utils.GENERAL, function() {
        helper.waitFor(function() {
          // as we've removed the second scene so we wait to update the scenes
          // length object to only 1 element
          return scriptLengthChangedEvent;
        }, 4000).done(done);
      }, LAST_HEADING_LINE);
      this.timeout(6000);
    });

    after(function() {
      utils.undo();
    });

    it('updates the scenes length object', function(done) {
      var scenesLength = getScenesLength();
      var expectedSceneLength = getLineDefaultSize() * 4; // 1 heading + 1 general = 4 lines
      expect(scenesLength[0]).to.be.within(
        expectedSceneLength - TOLERANCE,
        expectedSceneLength + TOLERANCE
      );
      expect(scenesLength.length).to.be(1);
      done();
    });

    context('ep_scene_navigator - integration with navigator data', function() {
      it('triggers the script length change event with updateNavigator data equals to true', function(done) {
        expect(scriptLengthChangedEvent).to.be(true);
        expect(scriptLengthEventData.forceNavigatorUpdate).to.be(true);
        done();
      });
    });
  });
});
