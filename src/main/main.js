var app = require('app');
var BrowserWindow = require('browser-window');
var menu = require('./menu');

process.env.PATH += ':/usr/local/bin';

var mainWindow;

app.on('ready', function () {

    var atomScreen = require('screen');
    var size = atomScreen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: size.width,
        height: size.height,
		'web-preferences': {
			'overlay-scrollbars': true
		},
        resizable: true
    });

    mainWindow.loadUrl('file://' + __dirname + '/../../index.html');
    mainWindow.focus();
    menu.setMenu(app, mainWindow);
});
