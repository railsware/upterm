import Terminal from "../Terminal";
import PluginManager from "../PluginManager";
var remote = require("remote");
var app = remote.require("app");

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: () => {},

    currentWorkingDirectoryDidChange: (terminal: Terminal, directory: string) => {
        app.addRecentDocument(directory);
        remote.getCurrentWindow().setRepresentedFilename(directory);
    },
});
