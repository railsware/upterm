import {handleUserEvent, UserEvent} from "./UserEventsHander";
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.LANG = process.env.LANG || "en_US.UTF-8";

import {loadAliasesFromConfig} from "../shell/Aliases";
const reactDOM = require("react-dom");
/* tslint:disable:no-unused-variable */
import * as React from "react";
import {ApplicationComponent} from "./1_ApplicationComponent";
import {loadAllPlugins} from "../PluginManager";
import {loadEnvironment} from "../shell/Environment";

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
    () => {
        // FIXME: Remove loadAllPlugins after switching to Webpack (because all the files will be loaded at start anyway).
        Promise.all([loadAllPlugins(), loadEnvironment(), loadAliasesFromConfig()])
            .then(() => {
                const application: ApplicationComponent = reactDOM.render(
                    <ApplicationComponent/>,
                    document.getElementById("react-entry-point"),
                );

                const userEventHandler = (event: UserEvent) => {
                    handleUserEvent(
                        application,
                        window.focusedTab,
                        window.focusedSession,
                        window.focusedJob,
                        window.focusedPrompt,
                        window.search,
                    )(event);
                };

                document.body.addEventListener("keydown", userEventHandler, true);
                document.body.addEventListener("paste", userEventHandler, true);
            });
    },
    false,
);
