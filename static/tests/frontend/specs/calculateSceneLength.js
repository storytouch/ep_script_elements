describe('ep_script_elements - calculate scene length', function() {
  var helperFunctions, smUtils;
  var FIRST_ACTION_LINE = 9;
  var FIRST_HEADING_LINE = 12;
  before(function(done) {
    helperFunctions = ep_script_elements_test_helper.calculateSceneLength;
    smUtils = ep_script_scene_marks_test_helper.utils;
    helper.newPad(function() {
      helperFunctions.createScript(done);
    });
    this.timeout(60000);
  });

  it('saves the length of scene on the headings', function(done) {
    helperFunctions.testIfScenesLengthValueIsCorrect(done);
  });

  context('when it edits an element of scene', function() {
    // action and shot has the same spacing
    context('and the scene length does not change', function() {
      var originalSceneId;
      before(function(done) {
        originalSceneId = helperFunctions.getSceneId(0); // first scene
        smUtils.changeLineToElement(smUtils.TRANSITION, FIRST_ACTION_LINE, done);
      });

      after(function(done) {
        smUtils.changeLineToElement(smUtils.ACTION, FIRST_ACTION_LINE, done);
      });

      it('does not update the scene length', function(done) {
        setTimeout(function() {
          var sceneId = helperFunctions.getSceneId(0);
          expect(sceneId).to.be(originalSceneId);
          done();
        }, 1500);
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
        helper.waitFor(function() {
          var sceneId = helperFunctions.getSceneId(targetScene);
          return originalSceneId !== sceneId;
        }, 2000).done(function() {
          var sceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
          var sceneLengthChanged = originalSceneLengthValue !== sceneLengthValue;
          expect(sceneLengthChanged).to.be(true);
          done();
        })
      })
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
        helper.waitFor(function() {
          var sceneId = helperFunctions.getSceneId(targetScene);
          return originalSceneId !== sceneId;
        }, 2000).done(function() {
          var sceneLengthValue = helperFunctions.getSceneLengthValue(targetScene);
          var sceneLengthChanged = originalSceneLengthValue !== sceneLengthValue;
          expect(sceneLengthChanged).to.be(true);
          done();
        })
      })
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
  sceneLengthValueIsInsideTolerance: function(expectedSceneLength, sceneLength) {
    return (expectedSceneLength - this.TOLERANCE <= sceneLength) && (sceneLength <= expectedSceneLength + this.TOLERANCE);
  },
  getExpectedScenesLength: function() {
    var lineDefaultSize = this.lineDefaultSize();
    return _.map(this.SCENE_LINES_LENGTH, function(sceneLineLength) {
      return sceneLineLength * lineDefaultSize;
    }, this);
  },
  testIfScenesLengthValueIsCorrect: function(cb) {
    var self = this;
    var utils = ep_script_elements_test_helper.utils;
    utils.waitForAddingSceneLengthClasses(function() {
      var scenesLength = self.getScenesLengthValue();
      var expectedScenesLength = self.getExpectedScenesLength();
      _.each(scenesLength, function(sceneLength, index) {
        var expectedSceneLength = expectedScenesLength[index];
        if (!self.sceneLengthValueIsInsideTolerance(expectedSceneLength, sceneLength)) {
          expect().fail(function() {
            return 'scene '  + index + ' should have length of ' + expectedSceneLength + ' but it got ' + sceneLength;
          });
        }
      });
      cb();
    });
  },
};
