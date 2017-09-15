import {
    emptyProvider,
    longFlag,
    provide,
    shortFlag,
    staticSuggestionsProvider,
    Suggestion,
} from "../autocompletion_utils/Common";
import {combine} from "../autocompletion_utils/Combine";
import {PluginManager} from "../../PluginManager";
import {AutocompletionContext, AutocompletionProvider} from "../../Interfaces";
import {executeCommand} from "../../PTY";
import {concat, find, memoize, sortBy} from "lodash";
import {homeDirectory} from "../../utils/Common";

interface FormulaAttributes {
    name: string;
    path: string;
}

const getFormulae = memoize(
    async(brewArgs: string[]): Promise<FormulaAttributes[]> => {
        const text = await executeCommand("brew", brewArgs, homeDirectory);

        const matches = text.match(/^([\-a-zA-Z0-9]+\/)*([\-a-zA-Z0-9]+)$/gm);
        if (matches) {
            return matches.map((match: string) => {
                const matchParts = match.split("/");
                return {
                    name: matchParts[matchParts.length - 1],
                    path: matchParts.length > 1 ? match.trim() : "",
                };
            });
        }
        return [];
    },
    (brewArgs: string[]) => brewArgs.join(" "),
);

const getAllFormulae = (cask: boolean) => getFormulae(cask ? ["cask", "search"] : ["search"]);
const getInstalledFormulae = (cask: boolean) => getFormulae(cask ? ["cask", "list"] : ["list"]);

const formulaSuggestions = async(formulae: FormulaAttributes[],
                                 query: string): Promise<Suggestion[]> => {
    if (!formulae) {
        return [];
    }
    return formulae
        .filter(formula =>  !query ||
        formula.name.startsWith(query) ||
        formula.path.startsWith(query))
        .map(formula => ({
            label: formula.name,
        }));
};

const availableFormulae = provide(async context => {
    const argument = context.argument.command.nthArgument(2);
    const query = argument ? argument.value : "";
    return formulaSuggestions(await getAllFormulae(false), query);
});

const installedFormulae = provide(async context => {
    const argument = context.argument.command.nthArgument(2);
    const query = argument ? argument.value : "";
    return formulaSuggestions(await getInstalledFormulae(false), query);
});

const caskAvailableFormulae = provide(async context => {
    const argument = context.argument.command.nthArgument(3);
    const query = argument ? argument.value : "";
    return formulaSuggestions(await getAllFormulae(true), query);
});

const caskInstalledFormulae = provide(async context => {
    const argument = context.argument.command.nthArgument(3);
    const query = argument ? argument.value : "";
    return formulaSuggestions(await getInstalledFormulae(true), query);
});

interface BrewCommandData {
    name: string;
    description: string;
    provider?: AutocompletionProvider;
    commands?: BrewCommandData[];
}

const commonCommands: BrewCommandData[] = [
    {
        name: "search",
        description: "Perform a substring search of formula names",
        provider: combine([
            longFlag("desc"),
        ]),
    },
    {
        name: "update",
        description: "Fetch the newest version of Homebrew",
        provider: combine([
            longFlag("merge"),
            longFlag("force"),
        ]),
    },
    {
        name: "list",
        description: "List all installed formulae",
        provider: combine([
            longFlag("versions"),
            longFlag("pinned"),
        ]),
    },
    {
        name: "doctor",
        description: "Check your system for potential problems",
        provider: emptyProvider,
    },
    {
        name: "create",
        description: "Generate a formula for a downloadable file",
        provider: combine([
            longFlag("autotools"),
            longFlag("cmake"),
            longFlag("no-fetch"),
            longFlag("set-name"),
            longFlag("tap"),
        ]),
    },
];

const caskCommands: BrewCommandData[] = [
    {
        name: "install",
        description: "Install a Cask formula",
        provider: combine([
            caskAvailableFormulae,
            longFlag("force"),
            longFlag("skip-cask-deps"),
            longFlag("require-sha"),
        ]),
    },
    {
        name: "fetch",
        description: "Download a Cask formula",
        provider: combine([
            caskAvailableFormulae,
            longFlag("force"),
        ]),
    },
    {
        name: "remove",
        description: "Uninstall a Cask formula",
        provider: combine([
            caskInstalledFormulae,
            longFlag("force"),
        ]),
    },
    {
        name: "uninstall",
        description: "Uninstall a Cask formula",
        provider: combine([
            caskInstalledFormulae,
            longFlag("force"),
        ]),
    },
    {
        name: "cat",
        description: "Display the source to a Cask formula",
        provider: caskInstalledFormulae,
    },
    {
        name: "cleanup",
        description: "Remove old version and download files for formula",
        provider: combine([
            caskInstalledFormulae,
            longFlag("outdated"),
        ]),
    },
    {
        name: "info",
        description: "Display information about a Cask formula",
        provider: caskAvailableFormulae,
    },
    {
        name: "home",
        description: "Open a Cask formula homepage in the browser",
        provider: caskAvailableFormulae,
    },
    {
        name: "edit",
        description: "Edit a Cask formula",
        provider: caskInstalledFormulae,
    },
];

const brewCommands: BrewCommandData[] = [
    {
        name: "install",
        description: "Install a formula",
        provider: combine([
            availableFormulae,
            longFlag("debug"),
            longFlag("env"),
            longFlag("ignore-dependencies"),
            longFlag("only-dependencies"),
            longFlag("build-from-source"),
            longFlag("devel"),
            longFlag("keep-temp"),
            longFlag("cc"),
        ]),
    },
    {
        name: "cask",
        description: "Install a cask formula",
        commands: concat(caskCommands, commonCommands),
    },
    {
        name: "fetch",
        description: "Install a formula",
        provider: combine([
            availableFormulae,
            longFlag("force"),
            longFlag("retry"),
            longFlag("deps"),
            longFlag("build-from-source"),
            longFlag("force-bottle"),
        ]),
    },
    {
        name: "remove",
        description: "Uninstall a formula",
        provider: combine([
            installedFormulae,
            longFlag("force"),
        ]),
    },
    {
        name: "uninstall",
        description: "Uninstall a formula",
        provider: combine([
            installedFormulae,
            longFlag("force"),
        ]),
    },
    {
        name: "upgrade",
        description: "Upgrade a formula",
        provider: combine([
            installedFormulae,
            longFlag("upgrade"),
            longFlag("fetch-HEAD"),
        ]),
    },
    {
        name: "cat",
        description: "Display the source to a formula",
        provider: installedFormulae,
    },
    {
        name: "cleanup",
        description: "Remove old version and download files for formula",
        provider: combine([
            installedFormulae,
            longFlag("prune"),
            longFlag("dry-run"),
            shortFlag("s"),
        ]),
    },
    {
        name: "deps",
        description: "Show dependencies for a formula",
        provider: combine([
            availableFormulae,
            longFlag("1"),
            shortFlag("n"),
            longFlag("union"),
            longFlag("installed"),
            longFlag("include-build"),
            longFlag("include-optional"),
            longFlag("skip-recommended"),
            longFlag("tree"),
        ]),
    },
    {
        name: "info",
        description: "Display information about a formula",
        provider: combine([
            availableFormulae,
            longFlag("github"),
            longFlag("json"),
            longFlag("installed"),
            longFlag("all"),
        ]),
    },
    {
        name: "home",
        description: "Open a formula homepage in the browser",
        provider: availableFormulae,
    },
    {
        name: "options",
        description: "Display install options for a formula",
        provider: availableFormulae,
    },
    {
        name: "edit",
        description: "Edit a formula",
        provider: installedFormulae,
    },
];

const fromData = (commandsData: BrewCommandData[]) => {
    const suggestions = sortBy(
        commandsData.map(command => ({label: command.name, detail: command.description || ""})),
        suggestion => !suggestion.detail,
    );
    return staticSuggestionsProvider(suggestions);
};

let getProvider = (context: AutocompletionContext,
                   commandData: BrewCommandData[],
                   argIndex: number): AutocompletionProvider => {
    if (context.argument.position === argIndex) {
        return fromData(commandData);
    }

    const argument = context.argument.command.nthArgument(argIndex);
    if (!argument) {
        return emptyProvider;
    }

    const name = argument.value;
    const data = find(commandData, {name});

    if (data && data.commands) {
        return getProvider(context, data.commands, argIndex + 1);
    } else if (data && data.provider) {
        return data.provider;
    }

    return emptyProvider;
};

PluginManager.registerAutocompletionProvider("brew", async context => {
    const provider = getProvider(context, concat(brewCommands, commonCommands), 1);
    return provider(context);
});
