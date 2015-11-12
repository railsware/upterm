import Job from './Job';
import {OutputDecorator, EnvironmentObserverPlugin} from "./Interfaces";
import * as fs from 'fs';
import * as Path from 'path';
import * as _ from 'lodash';

export default class PluginManager {
    private static _outputDecorators: OutputDecorator[] = [];
    private static _environmentObservers: EnvironmentObserverPlugin[] = [];

    static registerOutputDecorator(decorator: OutputDecorator): void {
        this._outputDecorators.push(decorator);
    }

    static get outputDecorators(): OutputDecorator[] {
        return this._outputDecorators;
    }

    static registerEnvironmentObserver(plugin: EnvironmentObserverPlugin): void {
        this._environmentObservers.push(plugin);
    }

    static get environmentObservers(): EnvironmentObserverPlugin[] {
        return this._environmentObservers;
    }
}


function loadAllPlugins(): void {
    const pluginsDirectory = Path.join(__dirname, 'plugins');

    _._(fs.readdirSync(pluginsDirectory))
        .map(fileName => `${pluginsDirectory}/${fileName}`)
        .map(require)
        .pluck('default')
        .value();
}

loadAllPlugins();
