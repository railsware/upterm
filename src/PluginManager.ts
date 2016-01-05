import Job from './Job';
import {OutputDecorator, EnvironmentObserverPlugin, AutocompletionProvider} from "./Interfaces";
import * as Path from 'path';
import * as _ from 'lodash';
import Utils from "./Utils";

export default class PluginManager {
    private static _outputDecorators: OutputDecorator[] = [];
    private static _environmentObservers: EnvironmentObserverPlugin[] = [];
    private static _autocompletionProviders: AutocompletionProvider[] = [];

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

    static registerAutocompletionProvider(plugin: AutocompletionProvider): void {
        this._autocompletionProviders.push(plugin);
    }

    static get autocompletionProviders(): AutocompletionProvider[] {
        return this._autocompletionProviders;
    }
}


export async function loadAllPlugins(): Promise<void> {
    const pluginsDirectory = Path.join(__dirname, 'plugins');
    const filePaths = await Utils.filePathsRecursively(pluginsDirectory);

    _._(filePaths).map(require).pluck('default').value();
}
