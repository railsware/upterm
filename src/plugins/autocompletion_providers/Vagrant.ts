import {PluginManager} from "../../PluginManager";
import {linedOutputOf} from "../../PTY";
import {commandWithSubcommands, emptyProvider, SubcommandConfig} from "../autocompletion_utils/Common";
import {once} from "lodash";
import {homeDirectory} from "../../utils/Common";

const vargrantCommandConfig = once(async() => {
    try {
        return (await linedOutputOf("vagrant", ["list-commands"], homeDirectory))
            .map(line => {
                const matches = line.match(/([\-a-zA-Z0-9]+)  /);

                if (matches) {
                    const name = matches[1];
                    const description = line.replace(matches[1], "").trim();

                    return {
                        name,
                        description,
                        provider: emptyProvider,
                    };
                }
            })
            .filter(suggestion => suggestion) as SubcommandConfig[];
    } catch (e) {
        return [] as SubcommandConfig[];
    }
});

PluginManager.registerAutocompletionProvider("vagrant", async (context) => {
    return commandWithSubcommands(await vargrantCommandConfig())(context);
});
