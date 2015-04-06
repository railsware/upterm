var app = require('app');
var BrowserWindow = require('browser-window');

app.commandLine.appendSwitch('js-flags', '--harmony');

process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

var mainWindow = null;

app.on('ready', function () {

    var atomScreen = require('screen');
    var size = atomScreen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: size.width,
        height: size.height,
        resizable: true
    });

    mainWindow.loadUrl('file://' + __dirname + '/../index.html');
});
