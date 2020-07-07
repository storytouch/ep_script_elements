describe('ep_script_elements - scenes length', function() {
  var utils = ep_script_elements_test_helper.utils;
  var LAST_HEADING_LINE = 5;
  var SCRIPT_LENGTH_CHANGED = 'script_length_changed';
  var TOLERANCE = 1;
  var scriptLengthEventDataList = []

  var waitToBuildScenesLengthObj = function(cb) {
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_script_elements;
    var scenesLength = thisPlugin.scenesLength;
    helper.waitFor(function() {
      var hasBuiltScenesLengthObject = scenesLength._scenesLength.length === 2;
      return hasBuiltScenesLengthObject;
    }, 4000).done(cb);
  }

  var getScenesLength = function() {
    var $headings = helper.padInner$('heading');
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_script_elements;
    var scenesLength = thisPlugin.scenesLength;
    return $headings.map(function() {
      return scenesLength.getSceneLengthOfHeading(this);
    });
  }

  var getLineDefaultSize = function() {
    return helper.padOuter$('#linemetricsdiv').get(0).getBoundingClientRect().height;
  }

  var listenToEventScriptLengthChanged = function() {
    // use same jQuery instance that triggers the event
    var $editor = helper.padInner$('#innerdocbody');
    helper.padChrome$($editor.get(0)).on(SCRIPT_LENGTH_CHANGED, function(e, data) {
      scriptLengthEventDataList.push({
        scriptLengthChangedEvent: true,
        scriptLengthEventData: data,
      })
    });
  }

  var resetEventData = function() {
    scriptLengthEventDataList = []
  }

  var eventScriptLengthChangedHasBeenCalled = function() {
    return scriptLengthEventDataList.length > 0
  }

  var eventScriptLengthChangedHasBeenCalledWith = function(params) {
    return scriptLengthEventDataList.some(function(entry) {
      return _.isEqual(entry.scriptLengthEventData, params)
    })
  }

  before(function(done) {
    utils.newPad(function(){
      var lastSceneTitle = 'last scene';
      var createScene = function(text) { return utils.synopsis(text) + utils.heading(text)}
      var script = createScene('scene') + createScene(lastSceneTitle);
      listenToEventScriptLengthChanged();
      utils.createScriptWith(script, lastSceneTitle, function() {
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
    before(function() {
      originalSceneLength = getScenesLength();
      var $lastHeading = helper.padInner$('heading').last();
      $lastHeading.sendkeys('{selectall}{rightarrow}EDITED');
    });

    after(function() {
      utils.undo();
    });

    it('does not change the scenes length object', function(done) {
      helper.waitFor(function() {
        var scenesLength = getScenesLength();
        var firstSceneKeptValue = originalSceneLength[0] === scenesLength[0];
        var secondSceneKeptValue = originalSceneLength[1] === scenesLength[1];
        var scenesLengthKeptValue = originalSceneLength.length === scenesLength.length;
        return firstSceneKeptValue && secondSceneKeptValue && scenesLengthKeptValue;
      }).done()
      done();
    });

    // this trigger is listened by ep_script_simple_page_view/static/js/calculateScriptLength.js
    it('triggers the script length change event with updateNavigator data equals to false', function(done) {
      const params = { forceNavigatorUpdate: false }
      helper.waitFor(function() {
        return eventScriptLengthChangedHasBeenCalledWith(params);
      }, 6000).done(done);
    });
  });

  context('when scene length changes', function() {
    before(function(done) {
      resetEventData();
      utils.changeToElement(utils.GENERAL, function() {
        helper.waitFor(function() {
          return eventScriptLengthChangedHasBeenCalled();
        }, 4000).done(done);
      }, LAST_HEADING_LINE);
      this.timeout(6000);
    });

    // wait until the scene length get its value updated to 3 lines as the
    // original state before running this context setup
    after(function(done) {
      utils.undo();
      helper.waitFor(function() {
        var scenesLength = getScenesLength();
        var expectedSceneLength = getLineDefaultSize() * 3; // 1 heading = 3 lines
        return expectedSceneLength - TOLERANCE <= scenesLength[0] &&
          scenesLength[0] <= expectedSceneLength + TOLERANCE;
      }, 2000).done(done);
      this.timeout(5000);
    });

    it('updates the scenes length object', function(done) {
      this.timeout(8000);
      helper.waitFor(function() {
        var scenesLength = getScenesLength();
        var expectedSceneLength = getLineDefaultSize() * 4; // 1 heading + 1 general = 4 lines
        return expectedSceneLength - TOLERANCE <= scenesLength[0] &&
          scenesLength[0] <= expectedSceneLength + TOLERANCE;
      }, 6000).done(function() {
        var scenesLength = getScenesLength();
        expect(scenesLength.length).to.be(1);
        done()
      });
    });

    it('triggers the script length change event with updateNavigator data equals to true', function(done) {
      const params = { forceNavigatorUpdate: true }
      helper.waitFor(function() {
        return eventScriptLengthChangedHasBeenCalledWith(params);
      }, 6000).done(done);
    });

    // this trigger is listened by ep_script_simple_page_view/static/js/calculateScriptLength.js
    it('also triggers the script length change event with updateNavigator data equals to false', function(done) {
      const params = { forceNavigatorUpdate: false }
      helper.waitFor(function() {
        return eventScriptLengthChangedHasBeenCalledWith(params);
      }, 6000).done(done);
    });
  });

  context('when user has script disabled and other user changes the scene length', function() {
    var multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    var originalSceneLength;
    before(function(done) {
      originalSceneLength = getScenesLength(); // get user A original scenes length
      ep_script_toggle_view_test_helper.utils.setEascMode(['scene']); // user A disables SCRIPT
      multipleUsers.openSamePadOnWithAnotherUser(function() {
        multipleUsers.startActingLikeOtherUser();

        // we need to force to make script visible. This is required because
        // we listen to EASC events from Teksto manager
        ep_script_toggle_view_test_helper.utils.setEascMode(['script']);

        // user B changes the scenes length
        utils.changeToElement(utils.GENERAL, done, LAST_HEADING_LINE);
      });
      this.timeout(50000);
    });

    it('updates the user scenes length', function(done) {
      this.timeout(10000)
      var scenesLength;
      multipleUsers.startActingLikeThisUser(); // change to user A
      helper.waitFor(function(){
        scenesLength = getScenesLength();
        return scenesLength[0] !== originalSceneLength[0];
      }, 6000).done(function() {
        expect(scenesLength.length).to.be(1);
        done();
      });
    });
  });
});
