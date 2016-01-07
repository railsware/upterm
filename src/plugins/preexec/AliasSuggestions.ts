import PluginManager from "../../PluginManager";
import Job from "../../Job";
import Aliases from "../../Aliases";
import * as _ from "lodash";

PluginManager.registerPreexecPlugin(async function(job: Job): Promise<void> {
    const input = job.prompt.value;
    const key = _.findKey(Aliases.all, value => value === input);

    if (key) {
        /* tslint:disable:no-unused-expression */
        new window.Notification(`You have an alias "${key}" for "${input}".`);
    }
});
