import {OutputDecorator, EnvironmentObserverPlugin, AutocompletionProvider, PreexecPlugin} from "./Interfaces";
import * as Path from "path";
import {recursiveFilesIn} from "./utils/Common";
import {environmentVariableSuggestions, anyFilesSuggestionsProvider} from "../src/plugins/autocompletion_utils/Common";
import combine from "../src/plugins/autocompletion_utils/Combine";

const defaultAutocompletionProvider = combine([environmentVariableSuggestions, anyFilesSuggestionsProvider]);

// FIXME: Technical debt: register all the plugin types via single method.
export class PluginManager {
    private static _outputDecorators: OutputDecorator[] = [];
    private static _environmentObservers: EnvironmentObserverPlugin[] = [];
    private static _autocompletionProviders: Dictionary<AutocompletionProvider> = {};
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

    static registerAutocompletionProvider(commandName: string, provider: AutocompletionProvider): void {
        this._autocompletionProviders[commandName] = provider;
    }

    static autocompletionProviderFor(commandName: string): AutocompletionProvider {
        return this._autocompletionProviders[commandName] || defaultAutocompletionProvider;
    }

    static registerPreexecPlugin(plugin: PreexecPlugin): void {
        this._preexecPlugins.push(plugin);
    }

    static get preexecPlugins(): PreexecPlugin[] {
        return this._preexecPlugins;
    }
}

const loadPreexecPlugins = async(): Promise<void> => {
    const preexecDirectory = Path.join(__dirname, "plugins", "preexec");
    const filePaths = await recursiveFilesIn(preexecDirectory);
    filePaths.forEach(path => {
        const module = require(path);
        if (typeof module.default !== "function") {
            console.error(`Invalid preexec plugin: ${path} does not export a function`);
        } else {
            PluginManager.registerPreexecPlugin(module.default);
        }
    });
};

export async function loadAllPlugins(): Promise<void> {
    await loadPreexecPlugins();

    const pluginsDirectory = Path.join(__dirname, "plugins");
    const filePaths = await recursiveFilesIn(pluginsDirectory);

    filePaths.map(require);
}
