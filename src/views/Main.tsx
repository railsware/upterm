process.env.NODE_ENV = "production";

import {loadAliasesFromConfig} from "../Aliases";
const reactDOM = require("react-dom");
/* tslint:disable:no-unused-variable */
import * as React from "react";
import {ApplicationComponent} from "./1_ApplicationComponent";
import {loadAllPlugins} from "../PluginManager";
import {loadEnvironment} from "../Environment";

document.addEventListener(
    "DOMContentLoaded",
    () => {
        // FIXME: Remove loadAllPlugins after switching to Webpack (because all the files will be loaded at start anyway).
        Promise.all([loadAllPlugins(), loadEnvironment(), loadAliasesFromConfig()])
            .then(() => reactDOM.render(<ApplicationComponent/>, document.getElementById("black-screen")));
    },
    false
);
