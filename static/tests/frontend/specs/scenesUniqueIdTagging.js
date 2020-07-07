describe('ep_script_elements - scenes unique id tagging', function() {
  var helperFunctions, padId;
  var sceneNavigatorUtils, multipleUsers;

  var FIRST_SCENE_LINE = 2;

  before(function(done) {
    helperFunctions = ep_script_elements_test_helper.generalTests;
    multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    sceneNavigatorUtils = ep_scene_navigator_test_helper.utils;

    padId = helper.newPad(function() {
      helperFunctions.createScript(function() {
        ep_scene_navigator_test_helper.utils.enableAllEASCButtons(done);
      });
    });
    this.timeout(20000);
  });

  context('when the pad is completely loaded', function() {
    var padSceneIds;

    before(function(done) {
      helperFunctions.getSceneIds(function(sceneIds) {
        padSceneIds = sceneIds;
        done();
      });
    });

    it('sets a unique for each heading', function(done) {
      expect(padSceneIds).to.have.length(2);
      expect(helperFunctions.hasOnlyUniqueEntries(padSceneIds)).to.be(true);
      done();
    });

    context('and user reloads the pad', function() {
      var padSceneIdsAfterReload;

      before(function(done) {
        helperFunctions.reloadPad(padId, function() {
          helperFunctions.getSceneIds(function(sceneIds) {
            padSceneIdsAfterReload = sceneIds;
            done();
          });
        });
      });

      it('does not change the scene ids', function(done) {
        expect(padSceneIds).to.eql(padSceneIdsAfterReload);
        done();
      });
    });

    context('and other user has this pad opened', function() {
      var padSceneIdsForOtherUser;

      before(function(done) {
        multipleUsers.openSamePadOnWithAnotherUser(function() {
          multipleUsers.startActingLikeOtherUser();
          helperFunctions.getSceneIds(function(sceneIds) {
            padSceneIdsForOtherUser = sceneIds;
            done();
          });
        });
        this.timeout(4000);
      });

      after(function() {
        multipleUsers.startActingLikeThisUser(); // change focus to the main script
        multipleUsers.closePadForOtherUser(); // closes the other user script
      })

      it('does not change the scene ids for the other user', function(done) {
        expect(padSceneIdsForOtherUser).to.eql(padSceneIds);
        done();
      });

      context('and user adds a SCENE', function() {
        var padSceneIdsAfterCreatingNewScene, padSceneIdsAfterCreatingNewSceneForOtherUser;

        before(function(done) {
          multipleUsers.startActingLikeThisUser();
          helperFunctions.addSceneAbove(FIRST_SCENE_LINE, function() {
            // get new scene ids for this user
            helperFunctions.getSceneIds(function(sceneIds) {
              padSceneIdsAfterCreatingNewScene = sceneIds;

              // get new scene ids for the other user
              multipleUsers.startActingLikeOtherUser();
              helperFunctions.getSceneIds(function(sceneIds) {
                padSceneIdsAfterCreatingNewSceneForOtherUser = sceneIds;

                // change focus to the main script again
                multipleUsers.startActingLikeThisUser();
                done();
              });
            });
          });
        });

        it('creates a new id for the new heading', function(done) {
          expect(padSceneIdsAfterCreatingNewScene).to.have.length(3);
          expect(helperFunctions.hasOnlyUniqueEntries(padSceneIdsAfterCreatingNewScene)).to.be(true);
          done();
        });

        it('keeps the caret in the new heading line', function(done) {
          var newHeadingLineNumber = 2;
          expect(helperFunctions.getLineNumberWhereCaretIs()).to.be(newHeadingLineNumber);
          done();
        });

        it('updates the other user with the same scene ids', function(done) {
          expect(padSceneIdsAfterCreatingNewSceneForOtherUser).to.eql(padSceneIdsAfterCreatingNewScene);
          done();
        });
      });
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.generalTests = {
  createScript: function(cb) {
    var SMUtils = ep_script_scene_marks_test_helper.utils;
    SMUtils.cleanPad(function() {
      var firstScene = SMUtils.createSynopsis('heading 1');
      var action = SMUtils.action('first action');
      var secondScene = SMUtils.createSynopsis('heading 2');
      var dialogue = SMUtils.dialogue('last');
      var script = firstScene + action + secondScene + dialogue;
      SMUtils.createScriptWith(script, 'last', cb);
    });
  },
  reloadPad: function(targetPadId, done) {
    return helper.newPad(function() {
      ep_scene_navigator_test_helper.utils.enableAllEASCButtons(done);
    }, targetPadId);
  },
  addSceneAbove: function(line, cb) {
    shortcutAddSceneMark.MOUSE.addSceneAbove(line, cb);
  },
  getSceneIds: function(cb) {
    helper
      .waitFor(function() {
        var $headings = helper.padInner$('heading.scene-id');
        return $headings.length;
      })
      .done(function() {
        // from 'scene-id scid-A8B6RzMlZg0wHr9O' gets 'scid-A8B6RzMlZg0wHr9O'
        var sceneIds = [];
        var sceneIdRegex = new RegExp('scene-id (scid-[A-Za-z0-9]+)');
        var $headings = helper.padInner$('heading.scene-id');
        $headings.each(function(index, element) {
          var headingClass = helper.padInner$(element).attr('class');
          var sceneId = sceneIdRegex.exec(headingClass);
          if (sceneId && sceneId.length) sceneIds.push(sceneId[1]);
        });
        cb(sceneIds);
      });
  },
  hasOnlyUniqueEntries: function(array) {
    return _.uniq(array).length === array.length;
  },
  _getNodeWhereCaretIs: function() {
    return helper.padInner$.document.getSelection().anchorNode;
  },
  getLineWhereCaretIs: function() {
    var nodeWhereCaretIs = this._getNodeWhereCaretIs();
    var $lineWhereCaretIs = $(nodeWhereCaretIs)
      .parents('div')
      .last();
    return $lineWhereCaretIs;
  },
  getLineNumberWhereCaretIs: function() {
    var $lineWhereCaretIs = this.getLineWhereCaretIs();
    return $lineWhereCaretIs.index();
  },
};
