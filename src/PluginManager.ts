import {OutputDecorator, EnvironmentObserverPlugin, AutocompletionProvider, PreexecPlugin, AfterexecPlugin} from "./Interfaces";
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
    private static _afterexecPlugins: AfterexecPlugin[] = [];

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

    static registerAfterexecPlugin(plugin: AfterexecPlugin): void {
        this._afterexecPlugins.push(plugin);
    }

    static get afterexecPlugins(): PreexecPlugin[] {
        return this._afterexecPlugins;
    }
}


export async function loadAllPlugins(): Promise<void> {
    const pluginsDirectory = Path.join(__dirname, "plugins");
    const filePaths = await recursiveFilesIn(pluginsDirectory);

    filePaths.map(require).map((module: any) => module.default);
}
