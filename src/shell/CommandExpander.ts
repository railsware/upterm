import {Aliases} from "../Aliases";
import {scan, Token, concatTokens} from "./Scanner";

export function expandAliases(tokens: Token[], aliases: Aliases): Token[] {
    const commandWordToken = tokens[0];
    const argumentTokens = tokens.slice(1);
    const alias: string = aliases.get(commandWordToken.value);

    if (alias) {
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
