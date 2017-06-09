import {Prettyfier, EnvironmentObserverPlugin, AutocompletionProvider, PreexecPlugin} from "./Interfaces";
import * as Path from "path";
import {io} from "./utils/Common";
import {environmentVariableSuggestions, anyFilesSuggestionsProvider} from "../src/plugins/autocompletion_utils/Common";
import {combine} from "../src/plugins/autocompletion_utils/Combine";

const defaultAutocompletionProvider = combine([environmentVariableSuggestions, anyFilesSuggestionsProvider]);

// FIXME: Technical debt: register all the plugin types via single method.
export class PluginManager {
    private static _prettyfiers: Prettyfier[] = [];
    private static _environmentObservers: EnvironmentObserverPlugin[] = [];
    private static _autocompletionProviders: Dictionary<AutocompletionProvider> = {};
    private static _preexecPlugins: PreexecPlugin[] = [];

    static registerPrettyfier(prettyfier: Prettyfier): void {
        this._prettyfiers.push(prettyfier);
    }

    static get prettyfiers(): Prettyfier[] {
        return this._prettyfiers;
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


export async function loadAllPlugins(): Promise<void> {
    const pluginsDirectory = Path.join(__dirname, "plugins");
    const filePaths = await io.recursiveFilesIn(pluginsDirectory);

    filePaths.map(require).map((module: any) => module.default);
}
