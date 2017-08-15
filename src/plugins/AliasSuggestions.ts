import {services} from "../services/index";

services.jobs.onStart.subscribe(job => {
    const input = job.prompt.value;
    const alias = job.session.aliases.getNameByValue(input);

    if (alias && alias.length < input.length) {
        /* tslint:disable:no-unused-expression */
        new Notification("Alias Reminder", { body: `You have an alias "${alias}" for "${input}".` });
    }
});
