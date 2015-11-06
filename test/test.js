var selectors = require('./support/selectors');
var expect = require('chai').expect;
var blsk = require('./support/setup');

xdescribe('Black Screen', function() {
    beforeEach(function() { blsk.init(); });

    it('contains a prompt', function(done) {
        blsk.waitFor(selectors.prompt)
            .then(function(error, result) { expect(result.length).to.eql(1) })
            .call(done);
    });

    it('selects the promts on start', function(done) {
        blsk.isSelected(selectors.prompt)
            .then(function(error, isSelected) {expect(isSelected).to.be.true()})
            .call(done);
    });

    it('executes commands', function(done) {
        blsk.addValue(selectors.prompt, 'ls\n')
            .waitForText(selectors.output)
            .ggetText(selectors.output)
            .then(function(text) {expect(text[0]).to.not.be.empty() })
            .call(done);
    });

    describe('Autocomplete', function() {
        it('is not displayed if the prompt is blank', function(done) {
            blsk.isExisting(selectors.autocomplete)
                .then(function(error, isExisting) { expect(isExisting).to.be.false() })
                .call(done);
        });

        it('is displayed while typing', function(done) {
            blsk.addValue(selectors.prompt, 'ls')
                .isExisting(selectors.autocomplete)
                .then(function(error, isExisting) { expect(isExisting).to.be.true() })
                .call(done);
        });

        it('shows options suggestions', function(done) {
            blsk.addValue(selectors.prompt, 'git --ver')
                .waitForText(selectors.autocomplete)
                .then(function(error, text) { expect(text).to.contain('version') })
                .call(done);
        });

        it('can autocomplete the second lexeme', function(done) {
            blsk.addValue(selectors.prompt, 'git --ver')
                .waitForText(selectors.autocomplete)
                .addValue(selectors.prompt, '\t')
                .ggetText(selectors.prompt, function(error, text) { expect(text).to.eql('git --version '); })
                .call(done);
        });
    });

    afterEach(function(done) { blsk.end(done); });
});
