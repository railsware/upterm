var app = require('app');
var BrowserWindow = require('browser-window');
var menu = require('./Menu');

process.env.PATH += ':/usr/local/bin';

var mainWindow;

app.on('open-file', function (event, file) {
    getMainWindow().webContents.send('change-working-directory', file);
});

app.on('ready', getMainWindow);

app.on('mainWindow-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate-with-no-open-windows', getMainWindow);

function getMainWindow() {
    if (mainWindow) return mainWindow;

    var workAreaSize = require('screen').getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        'web-preferences': {
            'experimental-features': true,
            'experimental-canvas-features': true,
            'subpixel-font-scaling': true,
            'overlay-scrollbars': true
        },
        resizable: true,
        'min-width': 500,
        'min-height': 300,
        width: workAreaSize.width,
        height: workAreaSize.height,
        show: false
    });

    mainWindow.loadUrl('file://' + __dirname + '/../views/index.html');
    menu.setMenu(app, mainWindow);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    mainWindow.webContents.on('did-finish-load', function () {
        mainWindow.show();
        mainWindow.focus();
    });
}
