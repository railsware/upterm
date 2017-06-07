require('pty.js').fork('cat', ['output']).on('data', data => console.log(data));
