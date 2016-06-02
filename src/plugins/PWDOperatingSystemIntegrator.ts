import {Session} from "../Session";
import {PluginManager} from "../PluginManager";
import {remote} from "electron";

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: () => { /* do nothing */ },

    currentWorkingDirectoryDidChange: (session: Session, directory: string) => {
        remote.app.addRecentDocument(directory);
    },
});
