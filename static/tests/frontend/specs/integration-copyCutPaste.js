describe('ep_script_elements - integration with ep_script_copy_cut_paste - cut on elements without line mark', function(){
  before(function (done) {
    var utils = ep_script_elements_test_helper.utils;
    helper.newPad(function(){
      // we need to have an attribute applied (e.g. bold)
      var general = utils.general('<b>general</b>');
      utils.createScriptWith(general, 'general', done);
    });
    this.timeout(20000);
  });

  context('when user cuts a general with attributes applied', function(){
    before(function () {
      var $firstLine = helper.padInner$('div').first();
      helper.selectLines($firstLine, $firstLine, 0, 6);
      ep_script_copy_cut_paste_test_helper.utils.cut();
    });

    it('does not show a line marker in the text kept', function (done) {
      var $firstLine = helper.padInner$('div').first();
      expect($firstLine.text()).to.be('l');
      done();
    });

    it('keeps the attribute', function (done) {
      var $firstLine = helper.padInner$('div').first();
      var hasBoldApplied = $firstLine.find('b').length === 1;
      expect(hasBoldApplied).to.be(true)
      done();
    });
  });
});
