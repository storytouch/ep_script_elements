describe('ep_script_elements - calculate scene length', function() {
  var helperFunctions, smUtils;
  var utils = ep_script_elements_test_helper.utils;
  var multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
  var multipleUsersApiUtils = ep_script_copy_cut_paste_test_helper.multipleUsersApiUtils;

  var FIRST_ACTION_LINE = 9;
  var FIRST_HEADING_LINE = 8;
  var SECOND_HEADING_LINE = 12;
  var FOURTH_HEADING_LINE = 72;
  var SECOND_ACTION_LINE = 13;

  before(function(done) {
    helperFunctions = ep_script_elements_test_helper.calculateSceneLength;
    smUtils = ep_script_scene_marks_test_helper.utils;
    helper.newPad(function() {
      helperFunctions.speedUpTests();
      helperFunctions.createScript(function() {
        utils.waitForCalculatingTheScenesLength(done);
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
      var originalSceneLengthValue;
      var targetScene = 0; // first scene

      before(function(done) {
        originalSceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
        smUtils.changeLineToElement(smUtils.GENERAL, FIRST_ACTION_LINE, done);
      });

      after(function(done) {
        smUtils.changeLineToElement(smUtils.ACTION, FIRST_ACTION_LINE, done);
      });

      it('updates the scene length', function(done) {
        helperFunctions.testSceneLenghtWasUpdated(targetScene, originalSceneLengthValue, done);
      });
    });
  });

  context('when it changes an element type', function() {
    var originalSceneLengthValue;
    var targetScene = 0;

    context('and the element changed is a heading', function() {
      before(function(done) {
        originalSceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
        smUtils.changeLineToElement(smUtils.GENERAL, SECOND_HEADING_LINE, done);
      });

      after(function(done) {
        smUtils.undo();
        helper.waitFor(function() {
          return helperFunctions.getScenesLengthValue().length === 5;
        }, 2000).done(done);
      })

      it('updates the scene length', function(done) {
        helperFunctions.testSceneLenghtWasUpdated(targetScene, originalSceneLengthValue, done);
      });
    });
  })

  // this scenario is against https://trello.com/c/iBGGXL83/1936
  context('when user removes the next scene undoes the operation', function() {
    var targetScene = 2;
    var originalSceneLengthValue;
    before(function(done) {
      originalSceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
      // we need to move the scene down to change the top position of the edges
      smUtils.clickOnSceneMarkButtonOfLine(FIRST_HEADING_LINE);

      // force an edition on the top element of the next scene. This
      // recalculates the length of the first scene
      smUtils.changeLineToElement(smUtils.GENERAL, FOURTH_HEADING_LINE, function() {
        helper.waitFor(function() {
          var newSceneLength = helperFunctions.getSceneLengthValue(targetScene);
          return newSceneLength > originalSceneLengthValue;
        }, 2000).done(function() {
          // now, we force a recalculation of the first scene. Ideally, the
          // edges of the first scene should be recalculated
          utils.undo();
          done();
        })
      });
      this.timeout(5000)
    })

    it('keeps the same value', function(done) {
      helper.waitFor(function() {
        var sceneLength = helperFunctions.getSceneLengthValue(targetScene);
        return sceneLength === originalSceneLengthValue;
      }, 2000).done(done);
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

  // this scenario tests against https://trello.com/c/fvdjvPX0/1906.
  // When an element very next to a heading is edited, the heading is collected
  // only in the document where this edition was made. This may cause some
  // problems with the heading cache that is used to calculate the scene
  // length. As the heading is not collected on other user pad, we have to
  // force recalculate the heading position
  context('when there are more than one user on the pad', function() {
    before(function(done) {
      var self = this;
      helperFunctions.speedUpTests();
      multipleUsers.openSamePadOnWithAnotherUser(function() {
        multipleUsers.performAsOtherUser(function() {
          // enable script to other user otherwise it won't calculate the
          // scenes length
          utils._setEascScriptAsEnabled();

          helperFunctions.speedUpTests();
        }, done());
      });
      this.timeout(10000);
    });

    context('and one user updates a scene length before and the next scene', function() {
      var sceneValues;
      var targetScene = 1;
      before(function(done) {
        var newLinesLength = 10;
        helperFunctions.createNLinesAfterLine(FIRST_ACTION_LINE, newLinesLength);
        setTimeout(function() {
          helperFunctions.createNLinesAfterLine(SECOND_ACTION_LINE + newLinesLength, newLinesLength);
          sceneValues = helperFunctions.getScenesValueForBothUsers(targetScene);
          done();
        }, 1000)
      });

      it('has the same scene length for both users', function(done) {
        helperFunctions.waitForSceneLengthToBeUpdatedForBothUsers(sceneValues, targetScene, this, function() {
          var sceneValues = helperFunctions.getScenesValueForBothUsers(targetScene);
          var thisUserSceneLenth = sceneValues[0];
          var otherUserSceneLenth = sceneValues[1];
          expect(thisUserSceneLenth).to.equal(otherUserSceneLenth);
          done();
        });
        this.timeout(5000);
      })
    })
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
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_script_elements;
    var scenesLength = thisPlugin.scenesLength._scenesLength;
    return scenesLength;
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

  testSceneLenghtWasUpdated: function(targetScene, originalSceneLengthValue, done) {
    var self = this;

    helper.waitFor(function() {
      var sceneLengthValue = self.getSceneLengthValue(targetScene);
      return sceneLengthValue !== originalSceneLengthValue;
    }, 2000).done(done);
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

  createNLinesAfterLine: function(targetLine, numOfLines) {
    var utils = ep_script_elements_test_helper.utils;
    var $targetLine = utils.getLine(targetLine);
    var newLines = 'new line{enter}'.repeat(numOfLines);
    $targetLine.sendkeys('{selectall}{rightarrow}{enter}' + newLines);
  },

  waitForSceneLengthToBeUpdatedForBothUsers: function(scenesValue, targetScene, test, done) {
    var self = this;
    var utils = ep_cursortrace_test_helper.utils;
    var multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    test.timeout(5000);
    helper.waitFor(function() {
      var newScenesValue = self.getScenesValueForBothUsers(targetScene);
      return (scenesValue[0] !== newScenesValue[0]) && (scenesValue[1] !== newScenesValue[1]);
    }, 2500).done(done);
  },

  getScenesValueForBothUsers: function(targetScene) {
    var multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    multipleUsers.startActingLikeThisUser();
    var thisUserSceneValue = this.getSceneLengthValue(targetScene);
    multipleUsers.startActingLikeOtherUser();
    var otherUserSceneValue = this.getSceneLengthValue(targetScene);
    return [thisUserSceneValue, otherUserSceneValue];
  },
};
