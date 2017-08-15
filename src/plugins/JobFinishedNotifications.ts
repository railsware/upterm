import {services} from "../services/index";
import {remote} from "electron";
import {Status} from "../Enums";

services.sessions.afterJob.subscribe(job => {
    const electronWindow = remote.BrowserWindow.getAllWindows()[0];

    if (remote.app.dock && !electronWindow.isFocused()) {
        remote.app.dock.bounce("informational");
        remote.app.dock.setBadge(job.status === Status.Success ? "1" : "✕");

        const title = job.status === Status.Success ? "Completed" : "Failed";

        /* tslint:disable:no-unused-expression */
        new Notification(title, {body: job.prompt.value});
    }
});

const electronWindow = remote.BrowserWindow.getAllWindows()[0];
electronWindow.on("focus", () => remote.app.dock && remote.app.dock.setBadge(""));
