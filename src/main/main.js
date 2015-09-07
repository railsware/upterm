var app = require('app');
var BrowserWindow = require('browser-window');
var menu = require('./menu');

process.env.PATH += ':/usr/local/bin';

var mainWindow;

app.on('ready', function () {

    mainWindow = new BrowserWindow({
        width: 700,
        height: 450,
        resizable: true
    });

    mainWindow.loadUrl('file://' + __dirname + '/../../index.html');
    mainWindow.focus();
    menu.setMenu(app, mainWindow);
});
