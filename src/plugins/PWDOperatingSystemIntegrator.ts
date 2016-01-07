import Terminal from "../Terminal";
import PluginManager from "../PluginManager";
const remote = require("remote");
const app = remote.require("app");

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: () => { /* do nothing */ },

    currentWorkingDirectoryDidChange: (terminal: Terminal, directory: string) => {
        app.addRecentDocument(directory);
        remote.getCurrentWindow().setRepresentedFilename(directory);
    },
});
