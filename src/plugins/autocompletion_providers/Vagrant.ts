import {PluginManager} from "../../PluginManager";
import {linedOutputOf} from '../../PTY';
import {styles, Suggestion} from "./Common";
import {memoize} from 'lodash';

const commands = memoize(async() => {
    let lines: string[] = [];

    try {
        lines = await linedOutputOf("vagrant", ["list-commands"], process.env.HOME);
    } catch (e) {
    }

    return lines
        .map(line => {
            const matches = line.match(/([\-a-zA-Z0-9]+)  /);

            if (matches) {
                const name = matches[1];
                const description = line.replace(matches[1], "").trim();

                return new Suggestion()
                    .withValue(name)
                    .withDescription(description)
                    .withStyle(styles.command)
                    .withSpace();
            }

            return null;
        })
        .filter(suggestion => suggestion);
});

PluginManager.registerAutocompletionProvider("vagrant", context => {
    if (context.argument.position === 1) {
        return commands();
    }

    return [];
});
