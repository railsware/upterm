import {Session} from "../Session";
import {PluginManager} from "../PluginManager";
import * as Path from "path";
import {exists} from "../utils/Common";
import {sourceFile} from "../Command";

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: () => void 0,
    currentWorkingDirectoryDidChange: async(session: Session, directory: string) => {
        if (await exists(Path.join(directory, ".env"))) {
            sourceFile(session, ".env");
        }
    },
});
