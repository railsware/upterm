import * as _ from "lodash";
import Aliases from "./Aliases";
import History from "./History";

export function expandHistory(lexemes: string[]): string[] {
    return _.flatten(lexemes.map(lexeme => historyReplacement(lexeme)));
}

export async function expandAliases(lexemes: string[]): Promise<string[]> {
    const commandName = lexemes[0];
    const args = lexemes.slice(1);
    const alias: string = await Aliases.find(commandName);

    if (alias) {
        const aliasArgs = lex(alias);
        const isRecursive = aliasArgs[0] === commandName;

        if (isRecursive) {
            return aliasArgs.concat(args);
        } else {
            return (await expandAliases(lex(alias))).concat(args);
        }
    } else {
        return [commandName, ...args];
    }
}

export function lex(input: string): string[] {
    if (input.length === 0) {
        return [];
    }

    let lexemes: string[] = input.match(/"(?:\\"|[^"])+"|'(?:\\'|[^'])+'|(?:[^ ]+\\ )+[^ ]+|[^ ]+/g) || [];

    if (input.endsWith(" ")) {
        lexemes.push("");
    }

    return lexemes;
}

export function isCompleteHistoryCommand(lexeme: string) {
    return ["!!", "!^", "!$", "!*"].includes(lexeme);
}

// FIXME: add recursive replacement, so that two !! in a row would work.
export function historyReplacement(lexeme: string): string[] {
    if (!isCompleteHistoryCommand(lexeme)) {
        return [lexeme];
    }

    const matcher = lexeme.substring(1);

    const position = parseInt(matcher, 10);
    if (!isNaN(position)) {
        return [History.at(position).raw];
    }

    const lastCommand = History.lastEntry;
    switch (lexeme) {
        case "!!":
            return lastCommand.historyExpanded;
        case "!^":
            return lastCommand.historyExpanded.slice(0, 1);
        case "!$":
            return [_.last(lastCommand.historyExpanded)];
        case "!*":
            return lastCommand.historyExpanded.slice(1);
        default:
            throw [History.lastWithPrefix(matcher).raw];
    }
}
