var app = require('app');
var BrowserWindow = require('browser-window');
var menu = require('./menu');

process.env.PATH += ':/usr/local/bin';

var mainWindow;

app.on('ready', function () {
	mainWindow = createWindow();
});

app.on('window-all-closed', function() {
	if(process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate-with-no-open-windows', function () {
	mainWindow = createWindow();
});

function createWindow() {
	var window = new BrowserWindow({
		'web-preferences': {
			'overlay-scrollbars': true
		},
		resizable: true,
		show: false
	});

	window.loadUrl('file://' + __dirname + '/../../index.html');
	menu.setMenu(app, window);
	
	window.on('closed', function() {
		window = null;
	});
	
	window.webContents.on('did-finish-load', function () {
		mainWindow.show();
		mainWindow.focus();
	});

	return window;
}
