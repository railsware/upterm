import {PluginManager} from "../../PluginManager";
import {linedOutputOf} from "../../PTY";
import {styles, Suggestion, contextIndependent} from "./Common";
import {executablesInPaths} from "../../utils/Common";

const commands = contextIndependent(async() => {
    return (await linedOutputOf("vagrant", ["list-commands"], process.env.HOME))
        .map(line => {
            const matches = line.match(/([\-a-zA-Z0-9]+)  /);

            if (matches) {
                const name = matches[1];
                const description = line.replace(matches[1], "").trim();

                return new Suggestion({
                    value: name,
                    description,
                    style: styles.command,
                    space: true,
                });
            }
        })
        .filter(suggestion => suggestion);
});

PluginManager.registerAutocompletionProvider("vagrant", async (context) => {
    const executables = await executablesInPaths(context.environment.path);

    if (!executables.includes("vagrant")) {
        return [];
    }

    if (context.argument.position === 1) {
        return commands();
    }

    return [];
});
