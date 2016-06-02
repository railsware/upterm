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
            const newPath = Path.join(homeDirectory, ".nvm", "versions", "node", version, "bin") + Path.delimiter + session.environment.path;

            session.environment.set("PATH", newPath);
        } else {
            const path = session.environment.path.split(Path.delimiter).filter(path => !path.includes(".nvm")).join(Path.delimiter);
            session.environment.setMany({PATH: path});
        }
    },
});
