import {PluginManager} from "../../PluginManager";
import {linedOutputOf} from '../../PTY';
import {styles, Suggestion, longAndShortFlag, longFlag} from "./Common";

interface Command {
    name: string;
    description: string;
    children: Command[];
}

const commands: Command[] = [];

(async function loadCommands() {
    let lines: string[] = [];

    try {
        lines = await linedOutputOf("vagrant", ["list-commands"], process.env.HOME);
    } catch (e) {}

    lines.forEach(line => {
        const matches = line.match(/([\-a-zA-Z0-9]+)  /);

        if (matches) {
            const name = matches[1];
            const description = line.replace(matches[1], "").trim();

            commands.push({
                name,
                description,
                children: [],
            });
        }
    });
})();

PluginManager.registerAutocompletionProvider("vagrant", context => {
    if (context.argument.position === 1) {
        return commands.map(command =>
            new Suggestion()
                .withValue(command.name)
                .withDescription(command.description)
                .withStyle(styles.command)
                .withSpace()
        );
    }

    return [];
});
