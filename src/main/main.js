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
	var userPrefsPath = path.join(app.getDataPath(), "preferences.json");
	var data;
	
	//Reading user's preferences file
	try {
		data = JSON.parse(fs.readFileSync(userPrefsPath, 'utf8'));
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
		//Applying user's preferences
		if(data.maximized) {
			window.maximize();
		} else {
			window.setBounds(data.bounds);
		}
	}
	
	window.loadUrl('file://' + __dirname + '/../../index.html');
	menu.setMenu(app, window);
	
	window.on('close', function () {
		//Remember window size and position before exit
		var data = {
			bounds: window.getBounds(),
			maximized: window.isMaximized()
		};
		
		fs.writeFileSync(userPrefsPath, JSON.stringify(data));
		
		window = null;
	});
	
	window.webContents.on('did-finish-load', function () {
		window.show();
		window.focus();
	});
	
	return window;
}
