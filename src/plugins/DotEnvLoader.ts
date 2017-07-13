import {Session} from "../shell/Session";
import {PluginManager} from "../PluginManager";
import * as Path from "path";
import {io} from "../utils/Common";
import {sourceFile} from "../shell/BuiltInCommands";

PluginManager.registerEnvironmentObserver({
    presentWorkingDirectoryWillChange: () => void 0,
    presentWorkingDirectoryDidChange: async(session: Session, directory: string) => {
        if (await io.fileExists(Path.join(directory, ".env"))) {
            sourceFile(session, ".env");
        }
    },
});
