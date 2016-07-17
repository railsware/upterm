import {PluginManager} from "../../PluginManager";
import {linedOutputOf} from "../../PTY";
import {styles, Suggestion, contextIndependent} from "./Common";

const commands = contextIndependent(async() => {
    let lines: string[] = [];

    try {
        lines = await linedOutputOf("vagrant", ["list-commands"], process.env.HOME);
    } catch (e) {
        // skip if command is not exist
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

            return undefined;
        })
        .filter(suggestion => suggestion);
});

PluginManager.registerAutocompletionProvider("vagrant", context => {
    if (context.argument.position === 1) {
        return commands();
    }

    return [];
});
