import {handleUserEvent} from "./keyevents/Keybindings";

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.LANG = process.env.LANG || "en_US.UTF-8";
process.env.COLORTERM = "truecolor";
process.env.TERM = "xterm-256color";

import {loadAliasesFromConfig} from "../shell/Aliases";
const reactDOM = require("react-dom");
import * as React from "react";
import {ApplicationComponent} from "./ApplicationComponent";
import {loadAllPlugins} from "../PluginManager";
import {loadEnvironment} from "../shell/Environment";
import {UserEvent} from "../Interfaces";
import {remote} from "electron";
import {buildMenuTemplate} from "./menu/Menu";

const browserWindow = remote.BrowserWindow.getAllWindows()[0];

document.addEventListener(
    "dragover",
    function(event) {
        event.preventDefault();
        return false;
    },
    false,
);

document.addEventListener(
    "drop",
    function(event) {
        event.preventDefault();
        return false;
    },
    false,
);

async function main() {
    // FIXME: Remove loadAllPlugins after switching to Webpack (because all the files will be loaded at start anyway).
    await Promise.all([loadAllPlugins(), loadEnvironment(), loadAliasesFromConfig()]);
    const application: ApplicationComponent = reactDOM.render(
        <ApplicationComponent/>,
        document.getElementById("react-entry-point"),
    );

    const template = buildMenuTemplate(remote.app, browserWindow, application);
    remote.Menu.setApplicationMenu(remote.Menu.buildFromTemplate(template));

    const userEventHandler = (event: UserEvent) => handleUserEvent(
        application,
        window.search,
        event,
    );

    document.body.addEventListener("keydown", userEventHandler, true);
    document.body.addEventListener("paste", userEventHandler, true);

    require("../language-server/ShellLanguageServer");
    require("../plugins/JobFinishedNotifications");
    require("../plugins/UpdateLastPresentWorkingDirectory");
    require("../plugins/SaveHistory");
    require("../plugins/SaveWindowBounds");
    require("../plugins/AliasSuggestions");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, false);
} else {
    main();
}
