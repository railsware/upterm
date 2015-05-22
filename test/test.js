const webdriverio = require('webdriverio');
const expect = require('chai').expect;
const selectors = require('./support/selectors');

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

describe('Black Screen', () => {
    beforeEach(() => client.init());

    it('contains a prompt', done => {
        client
            .waitFor(selectors.prompt)
            .then((error, result) => expect(result.length).to.eql(1))
            .call(done);
    });

    it('executes commands', done => {
        client.addValue(selectors.prompt, 'ls\n')
            .waitForText(selectors.output)
            .getText(selectors.output)
            .then(text => expect(text[0]).to.not.be.empty())
            .call(done);
    });

    afterEach(done => client.end(done));
});
