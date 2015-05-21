var webdriverio = require('webdriverio');

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
var page = require('./support/page')(client);

describe('prompt', function () {
    beforeEach(function () {
        client.init();
    });

    it('contains a prompt', function (done) {
        page.prompts(function (result) {
            expect(result.length).toEqual(1);
        }).call(done);
    });

    it('contains a prompt', function (done) {
        page.prompts(function (result) {
            expect(result.length).toEqual(1);
        }).call(done);
    });

    afterEach(function (done) {
        client.end(done);
    });
});
