import Session from "../Session";
import PluginManager from "../PluginManager";
const remote = require("remote");
const app = remote.require("app");

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: () => { /* do nothing */ },

    currentWorkingDirectoryDidChange: (session: Session, directory: string) => {
        app.addRecentDocument(directory);
        remote.getCurrentWindow().setRepresentedFilename(directory);
    },
});
