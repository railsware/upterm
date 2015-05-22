const webdriverio = require('webdriverio');

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

module.exports = webdriverio.remote(options);
