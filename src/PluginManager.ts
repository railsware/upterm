import Job from './Job';
import {OutputDecorator} from "./Interfaces";
import * as fs from 'fs';
import * as Path from 'path';
import * as _ from 'lodash';

export default class PluginManager {
    private static _outputDecorators: OutputDecorator[] = [];

    static registerOutputDecorator(decorator: OutputDecorator): void {
        this._outputDecorators.push(decorator);
    }

    static get outputDecorators(): OutputDecorator[] {
        return this._outputDecorators;
    }
}


function loadAllPlugins(): void {
    const pluginsDirectory = Path.join(__dirname, 'plugins', 'decorators');

    _._(fs.readdirSync(pluginsDirectory))
        .map(fileName => `${pluginsDirectory}/${fileName}`)
        .map(require)
        .pluck('default')
        .value();
}

loadAllPlugins();
