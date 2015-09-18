var fs = require('fs');
var _ = require('lodash');
function isDecorator(fileName) {
    return !_.include(['Base.js', 'List.js'], fileName);
}
function isJSFile(fileName) {
    return _.endsWith(fileName, '.js');
}
exports.list = _(fs.readdirSync(__dirname))
    .filter(isJSFile)
    .filter(isDecorator)
    .map(function (fileName) { return ("./" + fileName); })
    .map(require)
    .pluck('default')
    .value();
