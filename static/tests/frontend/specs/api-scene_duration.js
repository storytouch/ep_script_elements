describe('ep_script_elements - API - save scene duration', function() {
  var utils = ep_script_elements_test_helper.utils;
  var THIRD_HEADING_LINE = 20;
  var LAST_ELEMENT_TEXT = 'heading target';

  before(function(done) {
    utils.newPad(function(){
      var smUtils = ep_script_scene_marks_test_helper.utils;
      var sceneText = 'heading';
      var episode = smUtils.createEpi(sceneText);
      var act = smUtils.createAct(sceneText);
      var sequence = smUtils.createSeq(LAST_ELEMENT_TEXT)
      var script = episode + act + sequence;
      utils.createScriptWith(script, LAST_ELEMENT_TEXT, done);
    });
    this.timeout(10000);
  });

  var getSceneDurationClass = function(sceneIndex, cb) {
    var durationInSeconds;
    helper.waitFor(function() {
      // from sceneDuration-300 gets '300'
      var sceneDurationRegex = new RegExp('sceneDuration-([0-9]+)')
      var headingClass = helper.padInner$('heading').eq(sceneIndex).attr('class');
      durationInSeconds = sceneDurationRegex.exec(headingClass);
      return durationInSeconds.length;
    }).done(function(){
      cb(durationInSeconds[1]); // e.g. cb(300)
    })
  }

  context('when API receives a scene duration', function() {
    var sceneDuration = 2;
    var sceneIndex = 2;

    before(function() {
      utils.setDurationOfScene(sceneIndex, sceneDuration);
    });

    it('saves this value on the heading', function(done) {
      getSceneDurationClass(sceneIndex, function(durationClass) {
        expect(Number(durationClass)).to.be(sceneDuration * 60); // we save in seconds
        done();
      })
    })
    
    // we change to a general intentionally because if we don't remove the line
    // attribute will be added a "*" in the beginning of the text. On other
    // types of SE, only the scene duration class would be preserved
    context('and changes this heading to other element', function() {
      before(function(done) {
        var general = utils.GENERAL;
        utils.changeToElement(general, done, THIRD_HEADING_LINE);
      });

      it('removes the duration class', function(done) {
        var generalLine = THIRD_HEADING_LINE - 4; // we remove 4 scene marks (sequence)
        var generalText = helper.padInner$('div').eq(generalLine).text();
        expect(generalText).to.be(LAST_ELEMENT_TEXT);
        done();
      });
    })
  })

});
