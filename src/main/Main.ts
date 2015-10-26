const app = require('app');
const BrowserWindow = require('browser-window');
let menu = require('./Menu');

let browserWindow = null;

app.on('open-file', (event, file) => getMainWindow().webContents.send('change-working-directory', file))
    .on('ready', getMainWindow)
    .on('activate-with-no-open-windows', getMainWindow)
    .on('mainWindow-all-closed', () => process.platform === 'darwin' || app.quit());

function getMainWindow() {
    const workAreaSize = require('screen').getPrimaryDisplay().workAreaSize;

    if (!browserWindow) {
        browserWindow = new BrowserWindow({
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

        browserWindow.loadUrl('file://' + __dirname + '/../views/index.html');
        menu.setMenu(app, browserWindow);

        browserWindow.on('closed', () => browserWindow = null);

        browserWindow.webContents.on('did-finish-load', () => {
            browserWindow.show();
            browserWindow.focus();
        });
    }

    return browserWindow;
}
