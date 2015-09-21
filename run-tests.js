var Mocha = require('mocha');
var testDir = 'dist/test/';
var mocha = new Mocha();

Mocha.utils.lookupFiles(testDir, ['js'], true).forEach(mocha.addFile.bind(mocha));

mocha.run(process.exit);
