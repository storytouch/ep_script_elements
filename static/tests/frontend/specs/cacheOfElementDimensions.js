describe('ep_script_elements - cache of element dimensions', function() {
  var helperFunctions, smUtils, utils;
  var INDEX_OF_ACTION_SCENELESS = 0;
  var INDEX_OF_LAST_ACTION_SCENE_1 = 3;
  var INDEX_OF_ACTION_MIDDLE_SCENE_1 = 2;
  var INDEX_OF_TRANSITION = 0;
  var FIRST_SCENE = 0;
  var SECOND_SCENE = 1;
  var SECOND_HEADING_LINE_NUMBER = 9;
  var ACTION = 'action';
  var HEADING = 'heading';
  var TRANSITION = 'transition';

  before(function(done) {
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.cacheElementsDimensions;
    smUtils = ep_script_scene_marks_test_helper.utils;
    helper.newPad(function() {
      helperFunctions.createScript(function(){
        utils.waitForAddingSceneLengthClasses(done);
      });
    });
    this.timeout(60000);
  });

  var testIfElementCacheWasKept = function(line, elementType) {
    it('does not update the cache of the ' + elementType + ' of the scene', function(done) {
      helper.waitFor(function() {
        var elementCache = helperFunctions.getDimensionOfElement(line, elementType);
        return elementCache === null;
      }, 800)
        .done(function() {
          expect().fail(function() { return 'Element dimensions were recalculated'; });
        })
        .fail(function() {
          done(); // we kept the cache of the element dimensions
        });
    });
  }

  context('when it edits an element inside the scene', function() {
    var previousLastElementDimension;
    before(function(done){
      previousLastElementDimension = helperFunctions.getDimensionsOfLastElementOfScene(FIRST_SCENE);
      helperFunctions.editElement(INDEX_OF_ACTION_MIDDLE_SCENE_1, ACTION);
      done();
    });

    after(function(done) {
      // for some reason calling 'undo' does not work
      helperFunctions.resetScriptContent(done);
      this.timeout(20000);
    });

    testIfElementCacheWasKept(FIRST_SCENE, HEADING);

    it('updates the cache of the last element of the scene', function(done) {
      helperFunctions.waitForSaveOnCacheAgain(INDEX_OF_LAST_ACTION_SCENE_1, ACTION, this, function(elementDimension) {
        expect(elementDimension.bottom).to.be.greaterThan(previousLastElementDimension.bottom);
        done();
      });
    });
  });

  context('when it edits an element at the edge of the scene', function() {
    before(function(done){
      previousLastElementDimension = helperFunctions.getDimensionsOfLastElementOfScene(FIRST_SCENE);
      helperFunctions.editElement(INDEX_OF_LAST_ACTION_SCENE_1 , ACTION);
      helperFunctions.waitUntilCleanElementCache(INDEX_OF_LAST_ACTION_SCENE_1, ACTION, done);
    });

    after(function(){
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

    after(function(){
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
      var smUtils = ep_script_scene_marks_test_helper.utils
      smUtils.changeLineToElement(utils.ACTION, SECOND_HEADING_LINE_NUMBER, done, SECOND_HEADING_LINE_NUMBER - 2); // - 2 (remove synopsis lines)
    });

    after(function(){
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
  resetScriptContent: function(cb) {
    var self = this;
    var utils = ep_script_elements_test_helper.utils;
    utils.cleanPad(function(){
      self.createScript(function(){
        utils.waitForAddingSceneLengthClasses(cb);
      });
    });
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
    var stuff = $lines.eq(index).children();
    return targetElement._boundingClientRect;
  },
  waitUntilCleanElementCache: function(line, elementType, cb) {
    var self = this;
    helper.waitFor(function() {
      var elementDimension = self.getDimensionOfElement(line, elementType);
      return elementDimension === null;
    }).done(cb)
  },
  waitForSaveOnCacheAgain: function(line, elementType, test, cb){
    var elementDimension;
    var self = this;
    helper.waitFor(function() {
      elementDimension = self.getDimensionOfElement(line, elementType);
      return elementDimension; // we have built the cache already
    }, 5000).done(function() {
      cb(elementDimension);
    });
    test.timeout(20000);
  },
  editElement: function(line, elementType) {
    var $target = helper.padInner$('div:has(' + elementType + ')').eq(line);
    var newText = 'changed!'.repeat(15); // 2 lines
    $target.find(elementType).sendkeys('{selectall}').sendkeys(newText);
  },
};
