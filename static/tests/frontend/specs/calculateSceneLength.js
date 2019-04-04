describe('ep_script_elements - calculate scene length', function() {
  var helperFunctions, smUtils;
  var utils = ep_script_elements_test_helper.utils;

  var FIRST_ACTION_LINE = 9;
  var FIRST_HEADING_LINE = 12;

  before(function(done) {
    helperFunctions = ep_script_elements_test_helper.calculateSceneLength;
    smUtils = ep_script_scene_marks_test_helper.utils;
    helper.newPad(function() {
      helperFunctions.speedUpTests();
      helperFunctions.createScript(function() {
        utils.waitForAddingSceneLengthClasses(done);
      });
    });
    this.timeout(60000);
  });

  it('saves the length of scene on the headings', function(done) {
    helperFunctions.testIfScenesLengthValueIsCorrect();
    done();
  });

  // scenarios for https://trello.com/c/niKzu7yz/1747
  context('when it edits a heading', function() {
    var originalSceneId, originalSceneLengthValue;
    var targetScene = 0; // first scene

    // test for edition that would even change the scene length
    // (making the heading too long, for example)
    [
      {
        description: 'and inserted text is long',
        text: '[edited]'.repeat(40),
      },
      {
        description: 'and inserted text is short',
        text: '[edited]',
      },
    ].forEach(function(test) {
      context(test.description, function() {
        before(function() {
          originalSceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
          originalSceneId = helperFunctions.getSceneId(targetScene);
          var $heading = helper.padInner$('heading').first();
          $heading.sendkeys(test.text);
        });

        after(function() {
          utils.undo();
        })

        it('keeps the caret on the edited line', function(done) {
          helperFunctions.testCaretDidNotChangeToOtherLine(targetScene, originalSceneId, done, this);
        });
      });
    });
  });

  context('when it edits an element of scene', function() {
    // action and shot has the same spacing
    context('and the scene length does not change', function() {
      var originalSceneId;
      var targetScene = 0; // first scene

      before(function(done) {
        originalSceneId = helperFunctions.getSceneId(targetScene);
        smUtils.changeLineToElement(smUtils.TRANSITION, FIRST_ACTION_LINE, done);
      });

      after(function(done) {
        smUtils.changeLineToElement(smUtils.ACTION, FIRST_ACTION_LINE, done);
      });

      it('does not update the scene length', function(done) {
        this.timeout(2500);
        helperFunctions.testSceneLenghtWasNotUpdated(targetScene, originalSceneId, done);
      });
    });

    context('and the scene length changes', function() {
      var originalSceneId, originalSceneLengthValue;
      var targetScene = 0; // first scene

      before(function(done) {
        originalSceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
        originalSceneId = helperFunctions.getSceneId(targetScene);
        smUtils.changeLineToElement(smUtils.GENERAL, FIRST_ACTION_LINE, done);
      });

      after(function(done) {
        smUtils.changeLineToElement(smUtils.ACTION, FIRST_ACTION_LINE, done);
      });

      it('updates the scene length', function(done) {
        helperFunctions.testSceneLenghtWasUpdated(targetScene, originalSceneId, originalSceneLengthValue, done);
      });
    });
  });

  context('when it changes an element type', function() {
    var originalSceneId, originalSceneLengthValue;
    var targetScene = 0; // second scene

    context('and the element changed is a heading', function() {
      before(function(done) {
        originalSceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
        originalSceneId = helperFunctions.getSceneId(targetScene);
        smUtils.changeLineToElement(smUtils.GENERAL, FIRST_HEADING_LINE, done);
      });

      after(function() {
        smUtils.undo();
      })

      it('updates the scene length', function(done) {
        helperFunctions.testSceneLenghtWasUpdated(targetScene, originalSceneId, originalSceneLengthValue, done);
      });
    });
  })

  // this scenario tests if the calculation of the scene length is triggered
  // only when the editor is idle. We use the event "idleWorkTimer" to ensure
  // the editor is idle. In this particular case, we consider 2 consecutives
  // events the treshold to consider the editor idle. As the event is triggered
  // on every 1 second, we edit a line [1], wait for 1.5 second and edit it
  // again [2]. The calculation should process only after about 2 seconds after
  // the last edition
  context('when scene editions are made in an interval that does not let the editor idle between them', function() {
    var targetScene = 0;
    var originalSceneLengthValue;
    before(function() {
      helperFunctions.resetIdleWorkCounterInactivityThreshold();
      originalSceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
      var $heading = helper.padInner$('heading').first();
      var text = 'edited '.repeat(10); // [1]
      $heading.sendkeys(text);
      setTimeout(function() {
        var $heading = helper.padInner$('heading').first();
        $heading.sendkeys(text); // [2]
      }, 1500);
    });

    it('does not calculate the scene length', function(done) {
      this.timeout(5000);
      setTimeout(function() {
        var actualSceneLength = helperFunctions.getSceneLengthValue(targetScene);
        expect(actualSceneLength).to.be(originalSceneLengthValue);
        done();
      }, 3000);
    });
  })
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.calculateSceneLength = {
  TOLERANCE: 1,
  SCENE_LINES_LENGTH: [5, 5, 56, 14, 7],
  createScript: function (done) {
    var epSMUtils = ep_script_scene_marks_test_helper.utils;
    var utils = ep_script_elements_test_helper.utils;

    var sceneText    = 'scene';
    var actionText   = 'action';
    var generalText  = 'general';
    var lastLineText = 'last action';

    var episode    = epSMUtils.episode(sceneText);
    var act        = epSMUtils.act(sceneText);
    var sequence   = epSMUtils.sequence(sceneText);
    var synopsis   = epSMUtils.synopsis(sceneText);
    var heading    = epSMUtils.heading(sceneText);
    var action     = epSMUtils.action(actionText);
    var general    = epSMUtils.general(generalText);
    var lastAction = epSMUtils.action(lastLineText);

    // XXX: if we change the elements we must update SCENE_LINES_LENGTH
    var firstEpisode   = episode + act + sequence + synopsis + heading + action; // 5 lines
    var smallScene     = synopsis + heading + action; // 5 lines = 1/8
    var onePageScene   = synopsis + heading + general.repeat(53); // 56 lines = 1 page
    var twoEighthScene = synopsis + heading + general.repeat(11); // 14 lines = 2/8
    var oneEighthScene = synopsis + heading + action + lastAction; // 7 lines = 1/8
    var script         = firstEpisode + smallScene + onePageScene + twoEighthScene + oneEighthScene;
    utils.createScriptWith(script, lastLineText, done);
  },
  getSceneId: function(sceneIndex) {
    return helper.padInner$('div:has(heading)').eq(sceneIndex).attr('id');
  },
  getSceneLengthValue: function(index) {
    return this.getScenesLengthValue()[index];
  },
  getScenesLengthValue: function() {
    var utils = ep_script_elements_test_helper.utils;
    var sceneLengthClasses = utils.getHeadingsSceneLengthClass();
    return _.map(sceneLengthClasses, function(sceneLengthClass) {
      return Number(sceneLengthClass.split('-')[1]); // from 'sceneLength-123' gets 123
    });
  },
  lineDefaultSize: function() {
    return helper.padOuter$('#linemetricsdiv').get(0).getBoundingClientRect().height;
  },
  getExpectedScenesLength: function() {
    var lineDefaultSize = this.lineDefaultSize();
    return _.map(this.SCENE_LINES_LENGTH, function(sceneLineLength) {
      return sceneLineLength * lineDefaultSize;
    }, this);
  },

  waitForSceneToBeUpdated: function(targetScene, originalSceneId, done) {
    var self = this;
    return helper.waitFor(function() {
      var sceneId = self.getSceneId(targetScene);
      return originalSceneId !== sceneId;
    }, 2000).done(done);
  },

  testIfScenesLengthValueIsCorrect: function() {
    var scenesLength = this.getScenesLengthValue();
    var expectedScenesLength = this.getExpectedScenesLength();
    _.each(scenesLength, function(sceneLength, index) {
      var expectedSceneLength = expectedScenesLength[index];
      expect(sceneLength).to.be.within(
        expectedSceneLength - this.TOLERANCE,
        expectedSceneLength + this.TOLERANCE
      );
    }, this);
  },

  testSceneLenghtWasUpdated: function(targetScene, originalSceneId, originalSceneLengthValue, done) {
    var self = this;

    this.waitForSceneToBeUpdated(targetScene, originalSceneId, function() {
      var sceneLengthValue = self.getSceneLengthValue(targetScene);
      expect(sceneLengthValue).to.not.be(originalSceneLengthValue);
      done();
    });
  },

  testSceneLenghtWasNotUpdated: function(targetScene, originalSceneId, done) {
    var self = this;

    this.waitForSceneToBeUpdated(targetScene, originalSceneId, function() {
      // should not had been updated, test failed
      expect().fail(function() { return `Length of scene ${targetScene} was updated`; });
    }).fail(function() {
      // ok, there was no scene updated
      done();
    });
  },

  testCaretDidNotChangeToOtherLine: function(targetScene, originalSceneId, done, test) {
    var utils = ep_script_elements_test_helper.utils;
    test.timeout(5000);

    // need to wait for scene line to be updated, otherwise we might validate
    // too soon (before Etherpad even had processed the change)
    this.waitForSceneToBeUpdated(targetScene, originalSceneId, function() {
      helper.waitFor(function() {
        var lineWithCaret = utils.getLineWhereCaretIs().get(0);
        var editedLine = helper.padInner$('div:has(heading)').get(targetScene);
        return lineWithCaret !== editedLine;
      }, 2000).done(function() {
        // caret moved, test failed
        expect().fail(function() { return `Caret moved from line of scene ${targetScene}`; });
      }).fail(function() {
        // ok, caret stayed on target line
        done();
      });
    });
  },

  // don't wait for any idleWorkTimer event to run the scene length calculation
  speedUpTests: function() {
    this.setIdleWorkCounterInactivityThreshold(0);
  },

  resetIdleWorkCounterInactivityThreshold: function() {
    this.setIdleWorkCounterInactivityThreshold(2);
  },

  setIdleWorkCounterInactivityThreshold: function(value) {
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_script_elements;
    thisPlugin.updateSceneLengthSchedule._idleWorkCounterInactivityThreshold = value;
  },
};
