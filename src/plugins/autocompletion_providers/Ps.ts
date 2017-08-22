import {PluginManager} from "../../PluginManager";
import {
    shortFlag, mapSuggestions, provide, Suggestion,
}
    from "../autocompletion_utils/Common";
import {combine} from "../autocompletion_utils/Combine";
import {AutocompletionContext, AutocompletionProvider} from "../../Interfaces";
import {mapObject} from "../../utils/Common";
import * as Process from "../../utils/Process";

// ps option suggestions based on linux  man file:
// http://linux.die.net/man/1/ps
const shortOptions = combine(mapObject(
    {
        "C": {
            description: `Select by command name.`,
        },
        "G": {
            description: `Select by real group ID (RGID) or name.`,
        },
        "U": {
            description: `Select by effective user ID (EUID) or name.`,
        },

    },
    (option, info) => {
        return mapSuggestions(shortFlag(option),
                              suggestion => ({...suggestion, description: info.description}));
    },
));


interface TokenInfo {
    params: string[];
    start: string;
}

const argInfo = (context: AutocompletionContext): TokenInfo => {
    const token: string = context.argument.value;
    const flag = token.substring(0, token.indexOf("=") + 1);
    let params: string[] = [];
    let start = flag;
    if (token.includes(",")) {
        params = token.substring(start.length, token.lastIndexOf(",")).split(",");
        start = token.substring(0, token.lastIndexOf(",") + 1);
    }
    return <TokenInfo>{params: params, start: start};
};

interface LongFlagItem {
    flag: string;
    description: string;
    providers?: AutocompletionProvider;
}

const realUserSuggestions = provide(async context => {
    const arg = argInfo(context);
    const users = await Process.users();
    return users
        .filter(i => !arg.params.includes(i.ruser))
        .map(i =>
            ({
                label: arg.start + i.ruser, displayValue: i.ruser,
                description: `User '${i.ruser}' with id '${i.ruserid}'`,
            }));
});

const effectiveUserSuggestions = provide(async context => {
    const arg = argInfo(context);
    const users = await Process.users();
    return users
        .filter(i => !arg.params.includes(i.euser))
        .map(i =>
            ({
                label: arg.start + i.euser, displayValue: i.euser,
                description: `User '${i.euser}' with id '${i.euserid}'`,
            }));
});

const effectiveGroupSuggestions = provide(async context => {
    const arg = argInfo(context);
    const groups = await Process.groups();
    return groups
        .filter(i => !arg.params.includes(i.egroup))
        .map(i =>
            ({
                label: arg.start + i.egroup, displayValue: i.egroup,
                description: `Group '${i.egroup}' with id '${i.egroupid}'`,
            }));
});

const realGroupSuggestions = provide(async context => {
    const arg = argInfo(context);
    const groups = await Process.groups();
    return groups
        .filter(i => !arg.params.includes(i.rgroup))
        .map(i =>
            ({
                label: arg.start + i.rgroup, displayValue: i.rgroup,
                description: `Group '${i.rgroup}' with id '${i.rgroupid}'`,
            }));
});

const terminalSuggestions = provide(async context => {
    const arg = argInfo(context);
    const terminals = await Process.terminals();
    return terminals
        .filter(i => !arg.params.includes(i.name))
        .map(i => ({
            label: arg.start + i.name, displayValue: i.name,
            description: `Terminal '${i.name}' with ruser '${i.ruser}'`,
        }));
});

const processSuggestions = provide(async context => {
    const arg = argInfo(context);
    const processes = await Process.processes();
    return processes
        .filter(i => !arg.params.includes(i.pid))
        .map(i => ({
            label: arg.start + i.pid, displayValue: i.pid,
            description: `Process with command '${i.cmd.slice(0, 25)}'
                                and ruser '${i.ruser}'`,
        }));
});

const sessionSuggestions = provide(async context => {
    const arg = argInfo(context);
    const sessions = await Process.sessions();
    return sessions
        .filter(i => !arg.params.includes(i.sid))
        .map(i => ({
            label: arg.start + i.sid, displayValue: i.sid,
            description: `Session '${i.sid}' with ruser '${i.ruser}'
                                and rgroup '${i.rgroup}'`,
        }));
});

const longOptions: LongFlagItem[] = [
    {
        flag: "user=",
        description: `Select by effective user ID (EUID) or name. Identical to -u and U.`,
        providers: effectiveUserSuggestions,
    },
    {
        flag: "User=",
        description: `Select by real user ID (RUID) or name. Identical to -U.`,
        providers: realUserSuggestions,
    },
    {
        flag: "group=",
        description: `Select by effective group ID (EGID) or name.`,
        providers: effectiveGroupSuggestions,
    },
    {
        flag: "Group=",
        description: `Select by real group ID (RGID) or name. Identical to -G.`,
        providers: realGroupSuggestions,
    },
    {
        flag: "tty=",
        description: `selects the processes associated with the terminals given
                in ttylist. Identical to -T.`,
        providers: terminalSuggestions,
    },
    {
        flag: "pid=",
        description: `Select by process ID. Identical to -p and p.`,
        providers: processSuggestions,
    },
    {
        flag: "sid=",
        description: `Select by session ID. Identical to -s.`,
        providers: sessionSuggestions,
    },
];

const longFlagSuggestions = provide(async context => {
    let suggestions: Suggestion[] = [];
    const token: string = context.argument.value;
    for (let i of longOptions) {
        const flag = "--" + i.flag;
        suggestions.push({label: flag, detail: i.description});
        if (i.providers && token.startsWith(flag)) {
            let providerSuggestions = await i.providers(context);
            suggestions = [...suggestions, ...providerSuggestions];
        }
    }
    return suggestions;
});

const psSuggestions = combine([shortOptions, longFlagSuggestions]);

PluginManager.registerAutocompletionProvider("ps", psSuggestions);
