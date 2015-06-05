import Base = require('./Base');
import Invocation = require('../Invocation');
import fs = require('fs');
import _ = require('lodash');

function isDecorator(fileName: string) {
    return !_.include(['Base.js', 'List.js'], fileName);
}

function isJSFile(fileName: string) {
    return _.endsWith(fileName, '.js');
}

var list: Array<{new (invocation: Invocation): Base}> =
    _(fs.readdirSync(__dirname))
        .filter(isJSFile)
        .filter(isDecorator)
        .map((fileName) => { return `./${fileName}`})
        .map(require)
        .value();

export = list;
