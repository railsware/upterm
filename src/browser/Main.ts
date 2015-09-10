global.shellStartTime = Date.now();

var app = require('app');
var browserWindow = require('browser-window');

import fs = require('fs');
import path = require('path');
import menu = require('./Menu');
import {EventEmitter} from 'events';
import cp = require('child_process');

process.env.PATH += ':/usr/local/bin';

var start = function() {
	setupHome();

	app.on('ready', function () {
	    var mainWindow = new browserWindow({
	        width: 700,
	        height: 450,
	        resizable: true,
	        'web-preferences': {
	        	'overlay-scrollbars': true
	        },
	        frame: false
	    });

	    mainWindow.loadUrl('file://' + __dirname + '/../../index.html');
	    mainWindow.focus();
	    menu.setMenu(app, mainWindow);

	    console.log('App load time: ' + (Date.now() - global.shellStartTime) + 'ms');
	});

	app.on('window-all-closed', function() {
		app.quit();
	});
}

var setupHome = function() {
	if (process.env.BLACKSCREEN_HOME) return;

	var home = path.join(app.getHomeDir(), '.blackscreen');

	try
	{
		home = fs.realpathSync(home);
	} catch(err){}

	process.env.BLACKSCREEN_HOME = home;
}

start();