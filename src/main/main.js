var app = require('app');
var BrowserWindow = require('browser-window');
var menu = require('./menu');

process.env.PATH += ':/usr/local/bin';

var mainWindow;

app.on('ready', function () {
	mainWindow = createWindow();
});

app.on('window-all-closed', function() {
	if(process.platform != 'darwin') {
		app.quit();
	}
});

app.on('activate-with-no-open-windows', function () {
	mainWindow = createWindow();
});

function createWindow() {
	var path = require("path");
	var fs = require("fs");
	var initPath = path.join(app.getDataPath(), "init.json");
	var data;
	
	try {
		data = JSON.parse(fs.readFileSync(initPath, 'utf8'));
	} catch(e) {
		console.log(e.toString());
	}
	
	var window = new BrowserWindow({
		width: 700, 
		height: 450,
		'web-preferences': {
			'overlay-scrollbars': true
		},
		resizable: true,
		show: false
	});
	
	if(data) {
		window.setBounds(data.bounds);
	}
	
	window.loadUrl('file://' + __dirname + '/../../index.html');
	menu.setMenu(app, mainWindow);
	
	window.on('close', function () {
		var data = {
			bounds: mainWindow.getBounds()
		};
		
		fs.writeFileSync(initPath, JSON.stringify(data));
	});
	
	window.webContents.on('did-finish-load', function () {
		mainWindow.show();
		mainWindow.focus();
	});
	
	return window;
}
