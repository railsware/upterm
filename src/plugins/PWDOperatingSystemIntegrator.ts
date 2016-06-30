import {Session} from "../shell/Session";
import {PluginManager} from "../PluginManager";
import {remote} from "electron";

PluginManager.registerEnvironmentObserver({
    presentWorkingDirectoryWillChange: () => { /* do nothing */ },

    presentWorkingDirectoryDidChange: (session: Session, directory: string) => {
        remote.app.addRecentDocument(directory);
    },
});
