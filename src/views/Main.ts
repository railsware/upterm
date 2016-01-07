import Aliases from "../Aliases";
const ReactDOM = require("react-dom");
import * as React from "react";
import ApplicationComponent from "./1_ApplicationComponent";
import {loadAllPlugins} from "../PluginManager";

$(() => {
    loadAllPlugins()
        .then(() => Aliases.load())
        .then(() => ReactDOM.render(React.createElement(ApplicationComponent), document.getElementById("black-screen")));
});
