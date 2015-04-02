var app = require('app');
var BrowserWindow = require('browser-window');

process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

var mainWindow = null;

app.on('ready', function () {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800
    });

    mainWindow.loadUrl('file://' + __dirname + '/../index.html');
});
