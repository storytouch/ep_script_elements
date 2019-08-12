describe('ep_script_elements - cache of element dimensions', function() {
  var helperFunctions, smUtils;
  var utils = ep_script_elements_test_helper.utils;

  var INDEX_OF_ACTION_SCENELESS = 0;
  var INDEX_OF_LAST_ACTION_SCENE_1 = 3;
  var INDEX_OF_ACTION_MIDDLE_SCENE_1 = 2;
  var INDEX_OF_TRANSITION = 0;

  var FIRST_SCENE = 0;
  var SECOND_SCENE = 1;
  var SECOND_HEADING_LINE_NUMBER = 9;

  var ACTION = utils.ACTION;
  var HEADING = utils.HEADING;
  var TRANSITION = utils.TRANSITION;

  before(function(done) {
    helperFunctions = ep_script_elements_test_helper.cacheElementsDimensions;
    smUtils = ep_script_scene_marks_test_helper.utils;

    helper.newPad(function() {
      utils.speedUpCleanDimensionsSchedule();
      helperFunctions.createScript(done);
    });
    this.timeout(60000);
  });

  context('when it edits a scene heading', function() {
    var previousLastElementDimension;

    before(function(done) {
      // make sure last element is ready to start the test
      helper.waitFor(function() {
        previousLastElementDimension = helperFunctions.getDimensionsOfLastElementOfScene(FIRST_SCENE);
        return previousLastElementDimension;
      }, 5000).done(function() {
        helperFunctions.editElement(FIRST_SCENE, HEADING);
        done();
      });
      this.timeout(10000);
    });

    it('updates the cache of the last element of the scene', function(done) {
      helperFunctions.waitForSaveOnCacheAgain(INDEX_OF_LAST_ACTION_SCENE_1, ACTION, this, function(elementDimension) {
        expect(elementDimension.bottom).to.be.greaterThan(previousLastElementDimension.bottom);
        done();
      });
    });

    context('and user presses UNDO', function() {
      before(function() {
        previousLastElementDimension = helperFunctions.getDimensionsOfLastElementOfScene(FIRST_SCENE);
        utils.undo();
      });

      it('updates the cache of the last element of the scene', function(done) {
        helperFunctions.waitForSaveOnCacheAgain(INDEX_OF_LAST_ACTION_SCENE_1, ACTION, this, function(elementDimension) {
          expect(elementDimension.bottom).to.be.lessThan(previousLastElementDimension.bottom);
          done();
        });
      });
    });
  });

  context('when it edits an element at the edge of the scene', function() {
    var previousLastElementDimension;

    before(function(done) {
      this.timeout(5000);

      // make sure last element is ready to start the test
      helper.waitFor(function() {
        previousLastElementDimension = helperFunctions.getDimensionsOfLastElementOfScene(FIRST_SCENE);
        return previousLastElementDimension;
      }, 3000).done(function() {
        helperFunctions.editElement(INDEX_OF_LAST_ACTION_SCENE_1 , ACTION);
        done();
      });
    });

    after(function() {
      utils.undo();
    })

    it('updates the cache of the last element of the scene', function(done) {
      helperFunctions.waitForSaveOnCacheAgain(INDEX_OF_LAST_ACTION_SCENE_1, ACTION, this, function(elementDimension) {
        expect(elementDimension.bottom).to.be.greaterThan(previousLastElementDimension.bottom);
        done();
      });
    });
  });

  context('edits an element outside of a scene', function() {
    before(function() {
      helperFunctions.editElement(INDEX_OF_ACTION_SCENELESS, 'action');
    });

    after(function() {
      utils.undo();
    });

    it('does not update any cache', function(done) {
      helper.waitFor(function() {
        var firstHeadingCache = helperFunctions.getDimensionsOfScene(FIRST_SCENE);
        var secondHeadingCache = helperFunctions.getDimensionsOfScene(SECOND_SCENE);
        var lastElementOfFirstScene = helperFunctions.getDimensionsOfLastElementOfScene(FIRST_SCENE);
        var lastElementOfSecondScene = helperFunctions.getDimensionsOfLastElementOfScene(SECOND_SCENE);
        return
          firstHeadingCache        === null &&
          secondHeadingCache       === null &&
          lastElementOfFirstScene  === null &&
          lastElementOfSecondScene === null;
      }, 800)
        .done(function() {
          expect().fail(function() { return 'The cache of the elements were updated'; });
        })
        .fail(function() {
          done(); // we cached the element dimensions
        });
    })
  });

  context('when changes a heading to other element type', function() {
    var lastElementOfScene2;
    before(function(done) {
      // as we remove the second heading, the end of the the first scene will
      // be the same element that was the end of the second scene - the one
      // that was removed
      lastElementOfScene2 = helperFunctions.getDimensionsOfLastElementOfScene(SECOND_SCENE);
      smUtils.changeLineToElement(utils.ACTION, SECOND_HEADING_LINE_NUMBER, done, SECOND_HEADING_LINE_NUMBER - 2); // - 2 (remove synopsis lines)
    });

    after(function() {
      utils.undo();
    })

    it('updates the cache of the last element of the scene', function(done) {
      helperFunctions.waitForSaveOnCacheAgain(INDEX_OF_TRANSITION, TRANSITION, this, function(elementDimension) {
        expect(lastElementOfScene2.bottom).to.be.greaterThan(elementDimension.bottom);
        done();
      });
    });
  });
});

ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.cacheElementsDimensions = {
  createScript: function(cb) {
    var utils = ep_script_elements_test_helper.utils;
    var lastLineText = 'transition';
    var action = utils.action('action');
    var synopsis = utils.synopsis();
    var firstHeading = utils.heading('scene 0');
    var secondHeading = utils.heading('scene 1');
    var transition = utils.transition(lastLineText);

    var sceneHeadless = action;
    var firstScene = synopsis + firstHeading + action + action + action;
    var secondScene = synopsis + secondHeading + action + action + transition;
    var script = sceneHeadless + firstScene + secondScene;
    utils.createScriptWith(script, lastLineText, cb);
  },
  getDimensionsOfScene: function(index) {
    return this.getDimensionOfElement(index, 'heading');
  },
  getDimensionsOfLastElementOfScene: function(index) {
    var $targetScene = helper.padInner$('div:has(heading)').eq(index);
    var $targetElement = $targetScene.nextUntil('.sceneMark').last();
    return $targetElement.children().get(0)._boundingClientRect;
  },
  getDimensionOfElement: function(index, type) {
    var $lines = helper.padInner$('div:has(' + type + ')');
    var targetElement = $lines.eq(index).children().get(0);
    return targetElement._boundingClientRect;
  },
  waitUntilCleanElementCache: function(line, elementType, done) {
    var self = this;
    helper.waitFor(function() {
      var elementDimension = self.getDimensionOfElement(line, elementType);
      return elementDimension === null;
    }, 5000).done(done)
  },
  waitForSaveOnCacheAgain: function(line, elementType, test, done) {
    var elementDimension;
    var self = this;

    this.waitUntilCleanElementCache(line, elementType, function() {
      helper.waitFor(function() {
        elementDimension = self.getDimensionOfElement(line, elementType);
        return elementDimension; // we have built the cache already
      }, 5000).done(function() {
        done(elementDimension);
      });
    });
    test.timeout(20000);
  },
  editElement: function(line, elementType) {
    var $target = helper.padInner$('div:has(' + elementType + ')').eq(line);
    var newText = 'changed!'.repeat(15); // 2 lines
    $target.find(elementType).sendkeys('{selectall}').sendkeys(newText);
  },
};
