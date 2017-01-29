process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.LANG = process.env.LANG || "en_US.UTF-8";

import {loadAliasesFromConfig} from "../shell/Aliases";
const reactDOM = require("react-dom");
import * as React from "react";
import {ApplicationComponent} from "./1_ApplicationComponent";
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

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        // FIXME: Remove loadAllPlugins after switching to Webpack (because all the files will be loaded at start anyway).
        await Promise.all([loadAllPlugins(), loadEnvironment(), loadAliasesFromConfig()]);
        const application: ApplicationComponent = reactDOM.render(
            <ApplicationComponent/>,
            document.getElementById("react-entry-point"),
        );

        const template = buildMenuTemplate(remote.app, browserWindow, application);
        remote.Menu.setApplicationMenu(remote.Menu.buildFromTemplate(template));

        const userEventHandler = (event: UserEvent) => application.handleUserEvent(
            window.focusedSession,
            window.focusedJob,
            window.focusedPrompt,
            window.search,
            event,
        );

        document.body.addEventListener("keydown", userEventHandler, true);
        document.body.addEventListener("paste", userEventHandler, true);
    },
    false,
);
