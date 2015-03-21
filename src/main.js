var app = require('app');
var BrowserWindow = require('browser-window');

// process.stdin.setEncoding('utf8');
// process.stdin.setRawMode(true);


// term.pipe(process.stdout);
// process.stdin.pipe(term);

// term.on('close', function() {
// process.exit();
// });

var mainWindow = null;

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800
  });

  mainWindow.loadUrl('file://' + __dirname + '/../index.html');
});
