var webdriverio = require('webdriverio');
var expect = require('chai').expect;
var selectors = require('./support/selectors');

const options = {
    host: 'localhost',
    port: 4444,
    desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
            binary: './Black Screen.app/Contents/MacOS/Electron'
        }
    }
};

var client = webdriverio.remote(options);


describe('Black Screen', function() {
    beforeEach(function () {
        client.init();
    });

    it('contains a prompt', function (done) {
        client
            .waitFor(selectors.prompt)
            .then(function(error, result) {
                expect(result.length).to.eql(1);
            }).call(done);
    });

    it('executes commands', function (done) {
        client.addValue(selectors.prompt, 'ls\n')
            .waitForText(selectors.output)
            .getText(selectors.output)
            .then(function(text) { expect(text[0]).to.not.be.empty(); })
            .call(done);
    });

    afterEach(function (done) {
        client.end(done);
    });
});
