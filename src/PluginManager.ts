import {OutputDecorator, EnvironmentObserverPlugin, AutocompletionProvider, PreexecPlugin} from "./Interfaces";
import * as Path from "path";
import * as _ from "lodash";
import Utils from "./Utils";

// Technical debt: register all the plugin types via single method.
export default class PluginManager {
    private static _outputDecorators: OutputDecorator[] = [];
    private static _environmentObservers: EnvironmentObserverPlugin[] = [];
    private static _genericAutocompletionProviders: AutocompletionProvider[] = [];
    private static _specializedAutocompletionProviders: _.Dictionary<AutocompletionProvider[]> = {};
    private static _preexecPlugins: PreexecPlugin[] = [];

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
        if (plugin.forCommand) {
            if (!this._specializedAutocompletionProviders[plugin.forCommand]) {
                this._specializedAutocompletionProviders[plugin.forCommand] = [];
            }
            this._specializedAutocompletionProviders[plugin.forCommand].push(plugin);
        } else {
            this._genericAutocompletionProviders.push(plugin);
        }
    }

    static get genericAutocompletionProviders(): AutocompletionProvider[] {
        return this._genericAutocompletionProviders;
    }

    static specializedAutocompletionProvider(words: string[]): AutocompletionProvider[] {
        for (let length = words.length; length !== 0; --length) {
            let subcommand = _.take(words, length).join(" ");
            let providers = this._specializedAutocompletionProviders[subcommand];

            if (providers) {
                return providers;
            }
        }

        return [];
    }

    static registerPreexecPlugin(plugin: PreexecPlugin): void {
        this._preexecPlugins.push(plugin);
    }

    static get preexecPlugins(): PreexecPlugin[] {
        return this._preexecPlugins;
    }
}


export async function loadAllPlugins(): Promise<void> {
    const pluginsDirectory = Path.join(__dirname, "plugins");
    const filePaths = await Utils.recursiveFilesIn(pluginsDirectory);

    _._(filePaths).map(require).map("default").value();
}
