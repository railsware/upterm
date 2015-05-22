const selectors = require('./support/selectors');
const expect = require('chai').expect;
const blsk = require('./support/setup');

describe('Black Screen', () => {
    beforeEach(() => blsk.init());

    it('contains a prompt', done => {
        blsk.waitFor(selectors.prompt)
            .then((error, result) => expect(result.length).to.eql(1))
            .call(done);
    });

    it('selects the promts on start', done => {
        blsk.isSelected(selectors.prompt)
            .then((error, isSelected) => expect(isSelected).to.be.true())
            .call(done);
    });

    it('executes commands', done => {
        blsk.addValue(selectors.prompt, 'ls\n')
            .waitForText(selectors.output)
            .getText(selectors.output)
            .then(text => expect(text[0]).to.not.be.empty())
            .call(done);
    });

    describe('Autocomplete', () => {
        it('is not displayed if the prompt is blank', done => {
            blsk.isExisting(selectors.autocomplete)
                .then((error, isExisting) => expect(isExisting).to.be.false())
                .call(done);
        });

        it('is displayed while typing', done => {
            blsk.addValue(selectors.prompt, 'ls')
                .isExisting(selectors.autocomplete)
                .then((error, isExisting) => expect(isExisting).to.be.true())
                .call(done);
        });

        it('shows options suggestions', done => {
            blsk.addValue(selectors.prompt, 'git --ver')
                .waitFor(selectors.autocomplete)
                .then((error, autocompletes) => expect(autocompletes.length).to.eql(1))
                .call(done);
        });
    });

    afterEach(done => blsk.end(done));
});
