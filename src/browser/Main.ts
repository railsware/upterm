global.shellStartTime = Date.now();

var app = require('app');
var browserWindow = require('browser-window');

import fs = require('fs');
import path = require('path');
import menu = require('./Menu');

process.env.PATH += ':/usr/local/bin';

function start() {
	setupHome();

	app.on('ready', function () {
	    var mainWindow = new browserWindow({
	        width: 700,
	        height: 450,
	        resizable: true,
	        'web-preferences': {
	        	'overlay-scrollbars': true
	        }
	    });

	    mainWindow.loadUrl('file://' + __dirname + '/../../index.html');
	    mainWindow.focus();
	    menu.setMenu(app, mainWindow);

	    app.on('application:about', function() {
	    	console.log('about!');
	    });

	    console.log('App load time: ' + (Date.now() - global.shellStartTime) + 'ms');
	});

	app.on('window-all-closed', function() {
		if (process.platform != 'darwin') app.quit();
	});
}

function setupHome() {
	if (process.env.BLACKSCREEN_HOME) return;

	var home = path.join(app.getHomeDir(), '.blackscreen');

	try
	{
		home = fs.realpathSync(home);
	} catch(err){}

	process.env.BLACKSCREEN_HOME = home;
}

start();