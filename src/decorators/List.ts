import Base from './Base';
import Invocation from '../Invocation';
import * as fs from 'fs';
import * as _ from 'lodash';

function isDecorator(fileName: string) {
    return !_.include(['Base.js', 'List.js'], fileName);
}

function isJSFile(fileName: string) {
    return _.endsWith(fileName, '.js');
}

export var list = <(new (invocation: Invocation) => Base)[]>
    _._(fs.readdirSync(__dirname))
        .filter(isJSFile)
        .filter(isDecorator)
        .map(fileName => `./${fileName}`)
        .map(require)
        .pluck('default')
        .value();
