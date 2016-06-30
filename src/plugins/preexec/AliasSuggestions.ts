import {PluginManager} from "../../PluginManager";
import {Job} from "../../shell/Job";

PluginManager.registerPreexecPlugin(async function (job: Job): Promise<void> {
    const input = job.prompt.value;
    const alias = job.session.aliases.getNameByValue(input);

    if (alias && alias.length < input.length) {
        /* tslint:disable:no-unused-expression */
        new Notification("Alias Reminder", { body: `You have an alias "${alias}" for "${input}".` });
    }
});
