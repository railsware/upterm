import {PluginManager} from "../../PluginManager";
import {combine} from "../autocompletion_utils/Combine";
import {provide, Suggestion} from "../autocompletion_utils/Common";
import {AutocompletionContext, AutocompletionProvider} from "../../Interfaces";
import * as Process from "../../utils/Process";
import {find} from "lodash";

// ps option suggestions based on linux  man file:
// http://linux.die.net/man/1/ps
interface ShortFlagItem {
    flag: string;
    detail: string;
}

const shortOptions: ShortFlagItem[] = [
    {
        flag: "C",
        detail: `Select by command name.`,
    },
    {
        flag: "G",
        detail: `Select by real group ID (RGID) or name.`,
    },
    {
        flag: "U",
        detail: `Select by effective user ID (EUID) or name.`,
    },
];

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
    detail: string;
    provider: AutocompletionProvider;
}

const realUserSuggestions = provide(async context => {
    const arg = argInfo(context);
    const users = await Process.users();
    return users
        .filter(i => !arg.params.includes(i.ruser))
        .map(i =>
            ({
                label: i.ruser, displayValue: i.ruser,
                detail: `User '${i.ruser}' with id '${i.ruserid}'`,
            }));
});

const effectiveUserSuggestions = provide(async context => {
    const arg = argInfo(context);
    const users = await Process.users();
    return users
        .filter(i => !arg.params.includes(i.euser))
        .map(i =>
            ({
                label: i.euser, displayValue: i.euser,
                detail: `User '${i.euser}' with id '${i.euserid}'`,
            }));
});

const effectiveGroupSuggestions = provide(async context => {
    const arg = argInfo(context);
    const groups = await Process.groups();
    return groups
        .filter(i => !arg.params.includes(i.egroup))
        .map(i =>
            ({
                label: i.egroup, displayValue: i.egroup,
                detail: `Group '${i.egroup}' with id '${i.egroupid}'`,
            }));
});

const realGroupSuggestions = provide(async context => {
    const arg = argInfo(context);
    const groups = await Process.groups();
    return groups
        .filter(i => !arg.params.includes(i.rgroup))
        .map(i =>
            ({
                label: i.rgroup, displayValue: i.rgroup,
                detail: `Group '${i.rgroup}' with id '${i.rgroupid}'`,
            }));
});

const terminalSuggestions = provide(async context => {
    const arg = argInfo(context);
    const terminals = await Process.terminals();
    return terminals
        .filter(i => !arg.params.includes(i.name))
        .map(i => ({
            label: i.name, displayValue: i.name,
            detail: `Terminal '${i.name}' with ruser '${i.ruser}'`,
        }));
});

const processSuggestions = provide(async context => {
    const arg = argInfo(context);
    const processes = await Process.processes();
    return processes
        .filter(i => !arg.params.includes(i.pid))
        .map(i => ({
            label: i.pid, displayValue: i.pid,
            detail: `Process with command '${i.cmd.slice(0, 25)}'
                     and ruser '${i.ruser}'`,
        }));
});

const sessionSuggestions = provide(async context => {
    const arg = argInfo(context);
    const sessions = await Process.sessions();
    return sessions
        .filter(i => !arg.params.includes(i.sid))
        .map(i => ({
            label: i.sid, displayValue: i.sid,
            detail: `Session '${i.sid}' with ruser '${i.ruser} and
                     rgroup '${i.rgroup}'`,
        }));
});

const longOptions: LongFlagItem[] = [
    {
        flag: "user=",
        detail: `Select by effective user ID (EUID) or name. Identical to -u and U.`,
        provider: effectiveUserSuggestions,
    },
    {
        flag: "User=",
        detail: `Select by real user ID (RUID) or name. Identical to -U.`,
        provider: realUserSuggestions,
    },
    {
        flag: "group=",
        detail: `Select by effective group ID (EGID) or name.`,
        provider: effectiveGroupSuggestions,
    },
    {
        flag: "Group=",
        detail: `Select by real group ID (RGID) or name. Identical to -G.`,
        provider: realGroupSuggestions,
    },
    {
        flag: "tty=",
        detail: `selects the processes associated with the terminals given
                 in ttylist. Identical to -T.`,
        provider: terminalSuggestions,
    },
    {
        flag: "pid=",
        detail: `Select by process ID. Identical to -p and p.`,
        provider: processSuggestions,
    },
    {
        flag: "sid=",
        detail: `Select by session ID. Identical to -s.`,
        provider: sessionSuggestions,
    },
];

const psOptions = provide(async context => {
    let suggestions: Suggestion[] = [];
    const token: string = context.argument.value;

    if (!token.includes("=")) {
        const shortOptSuggestions = shortOptions.map(s =>
                <Suggestion>{label: "-" + s.flag, detail: s.detail});
        const longOptSuggestions = longOptions.map(l =>
                <Suggestion>{label: "--" + l.flag, detail: l.detail});
        suggestions = [...shortOptSuggestions, ...longOptSuggestions];
    }
    return suggestions;
});

const psLongOptionValues = provide(async context => {
    let suggestions: Suggestion[] = [];
    const token: string = context.argument.value;

    if (token.startsWith("--") && token.includes("=")) {
        const flag = token.slice(2, token.indexOf("=") + 1);
        const longOption = find(longOptions, {flag});
        suggestions = longOption ? await longOption.provider(context) : [];
    }
    return suggestions;
});

PluginManager.registerAutocompletionProvider("ps", combine([psOptions, psLongOptionValues]));
