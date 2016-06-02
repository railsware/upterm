import {Session} from "../Session";
import {PluginManager} from "../PluginManager";
import * as Path from "path";
import {homeDirectory, exists, readFile} from "../utils/Common";

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: () => void 0,
    currentWorkingDirectoryDidChange: async(session: Session) => {
        const rcPath = Path.join(session.directory, ".nvmrc");

        if (await exists(rcPath)) {
            const version = (await readFile(rcPath)).trim();
            session.environment.path.prepend(Path.join(homeDirectory, ".nvm", "versions", "node", version, "bin"));
        } else {
            session.environment.path.removeWhere(path => !path.includes(".nvm"));
        }
    },
});
