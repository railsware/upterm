import {executable, sequence, string, decorate, choice} from "../../Parser";
import {description, command} from "./Suggestions";
import {compose} from "../../utils/Common";
import * as _ from "lodash";

const railsCommandConfig = [
    {
        name: "runner",
        description: "Run a piece of code in the application environment",
    },
    {
        name: "console",
        description: "Start the Rails console",
    },
    {
        name: "server",
        description: "Start the Rails server",
    },
    {
        name: "generate",
        description: "Generate new code'g')",
    },
    {
        name: "destroy",
        description: "generate",
    },
    {
        name: "dbconsole",
        description: "Start a console for the Rails database",
    },
    {
        name: "new",
        description: "Create a new Rails application",
    },
    {
        name: "plugin new",
        description: "Generates skeleton for developing a Rails plugin",
    },
];

const railsCommand = choice(_.map(railsCommandConfig, config => decorate(string(config.name), compose(command, description(config.description)))));
export const rails = sequence(executable("rails"), railsCommand);
