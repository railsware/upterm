import {handleUserEvent} from "./keyevents/Keybindings";
import {handleMouseEvent} from "./mouseevents/MouseEvents";

process.env.PATH = "/usr/local/bin:" + process.env.PATH;
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
import {UserEvent, MouseEvent} from "../Interfaces";
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

async function main() {
    // Should be required before mounting Application.
    require("../monaco/PromptTheme");
    require("../monaco/ShellLanguage");
    require("../monaco/ShellHistoryLanguage");

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

    const mouseEventHandler = (event: MouseEvent) => handleMouseEvent(
        application,
        event,
    );

    document.body.addEventListener("keydown", userEventHandler, true);
    document.body.addEventListener("paste", userEventHandler, true);
    document.body.addEventListener("drop", mouseEventHandler, true);

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
