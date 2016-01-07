import Aliases from "../Aliases";
const reactDOM = require("react-dom");
import * as React from "react";
import ApplicationComponent from "./1_ApplicationComponent";
import {loadAllPlugins} from "../PluginManager";

$(() => {
    loadAllPlugins()
        .then(() => Aliases.load())
        .then(() => reactDOM.render(React.createElement(ApplicationComponent), document.getElementById("black-screen")));
});
