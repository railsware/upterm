import {PluginManager} from "../../PluginManager";
import {linedOutputOf} from "../../PTY";
import {commandWithSubcommands, emptyProvider, SubcommandConfig} from "../autocompletion_utils/Common";
import {executablesInPaths} from "../../utils/Common";
import {once} from "lodash";

const vargrantCommandConfig = once(async() => {
    const vagrantCommandListLines = await linedOutputOf("vagrant", ["list-commands"], process.env.HOME);
    return vagrantCommandListLines
        .map(line => {
            const matches = line.match(/([\-a-zA-Z0-9]+)  /);

            if (matches) {
                const name = matches[1];
                const description = line.replace(matches[1], "").trim();

                return {
                    name,
                    description,
                    completion: emptyProvider,
                };
            }
        })
        .filter(suggestion => suggestion) as SubcommandConfig[];
});

PluginManager.registerAutocompletionProvider("vagrant", async (context) => {
    const executables = await executablesInPaths(context.environment.path);

    if (!executables.includes("vagrant")) {
        return [];
    }

    return commandWithSubcommands(await vargrantCommandConfig())(context);
});
