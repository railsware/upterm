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

client.init()
    .url('http://www.google.com')
    .getTitle(function(err, title) {
        console.log('Title was: ' + title);
    })
    .end();
