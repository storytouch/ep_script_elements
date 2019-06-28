describe('ep_script_elements - API - scene mark set element type', function() {
  var CHANGE_SM_SET_MESSAGE_TYPE = 'scene_mark_set_element_changed';
  var utils = ep_script_elements_test_helper.utils;
  var apiUtils = ep_script_elements_test_helper.apiUtils;

  var EPISODE_NAME_OF_EP      = 0;
  var HEADING_OF_EPISODE      = 8
  var ACT_SUMMARY_OF_ACT      = 10;
  var HEADING_OF_ACT          = 15;
  var SYNOPSIS_SUMMARY_OF_SEQ = 19;
  var HEADING_OF_SEQ          = 20;
  var SYNOPSIS_NAME_OF_SCENE  = 21;
  var HEADING_OF_SCENE        = 23;
  var GENERAL_LINE            = 24;

  var smAndHeadingData = [
    {sceneMark: 'episode',  line: EPISODE_NAME_OF_EP,      type: 'scene mark'},
    {sceneMark: 'episode',  line: HEADING_OF_EPISODE,      type: 'heading'},
    {sceneMark: 'act',      line: ACT_SUMMARY_OF_ACT,      type: 'scene mark'},
    {sceneMark: 'act',      line: HEADING_OF_ACT,          type: 'heading'},
    {sceneMark: 'sequence', line: SYNOPSIS_SUMMARY_OF_SEQ, type: 'scene mark'},
    {sceneMark: 'sequence', line: HEADING_OF_SEQ,          type: 'heading'},
    {sceneMark: 'scene',    line: SYNOPSIS_NAME_OF_SCENE,  type: 'scene mark'},
    {sceneMark: 'scene',    line: HEADING_OF_SCENE,        type: 'heading'},
  ];

  before(function(done) {
    utils.newPad(function(){
      var lastElementText = 'last element';
      var smUtils = ep_script_scene_marks_test_helper.utils;
      var sceneText = 'heading';
      var episode = smUtils.createEpi(sceneText);
      var act = smUtils.createAct(sceneText);
      var sequence = smUtils.createSeq(sceneText);
      var scene = smUtils.createSynopsis(sceneText);
      var general = utils.general(lastElementText);
      var script = episode + act + sequence + scene + general;
      utils.createScriptWith(script, lastElementText, done);
    });
    this.timeout(10000);
  })

  context('when element type is a script element but heading', function() {
    before(function(done) {
      apiUtils.resetLastDataSent();
      utils.placeCaretOnLine(GENERAL_LINE, function() {
        apiUtils.waitForDataToBeSent(CHANGE_SM_SET_MESSAGE_TYPE, done);
      });
    });

    it('sends undefined via API', function(done) {
      expect(apiUtils.getLastSMSetElementChange()).to.be(undefined);
      done();
    })
  })

  smAndHeadingData.forEach(function(element) {
    var sceneMark = element.sceneMark;
    var line = element.line;
    var elementType = element.type;

    context(`when caret is on a ${elementType}`, function() {
      context(`and highest sm of set is a ${sceneMark}`, function() {
        before(function(done) {
          apiUtils.resetLastDataSent();
          utils.placeCaretOnLine(line, function() {
            apiUtils.waitForDataToBeSent(CHANGE_SM_SET_MESSAGE_TYPE, done);
          });
        });

        it(`send ${sceneMark} via API`, function(done) {
          expect(apiUtils.getLastSMSetElementChange()).to.be(sceneMark);
          done();
        })
      })
    })
  })
})
