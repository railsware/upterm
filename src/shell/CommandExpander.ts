import {Aliases} from "../Aliases";
import {scan, Token, concatTokens} from "./Scanner";

export function expandAliases(tokens: Token[], aliases: Aliases): Token[] {
    if (tokens.length === 0) {
        return [];
    }

    const commandWordToken = tokens[0];
    const argumentTokens = tokens.slice(1);

    if (aliases.has(commandWordToken.value)) {
        const alias = aliases.get(commandWordToken.value);
        const aliasTokens = scan(alias);
        const isRecursive = aliasTokens[0].value === commandWordToken.value;

        if (isRecursive) {
            return concatTokens(aliasTokens, argumentTokens);
        } else {
            return concatTokens(expandAliases(scan(alias), aliases), argumentTokens);
        }
    } else {
        return tokens;
    }
}
