import {Session} from "../shell/Session";
import {PluginManager} from "../PluginManager";
import * as Path from "path";
import {homeDirectory, io} from "../utils/Common";

async function withNvmPath(directory: string, callback: (path: string) => void) {
    const rcPath = Path.join(directory, ".nvmrc");

    if (await io.exists(rcPath)) {
        const version = (await io.readFile(rcPath)).trim();
        callback(Path.join(homeDirectory, ".nvm", "versions", "node", version, "bin"));
    }
}

PluginManager.registerEnvironmentObserver({
    presentWorkingDirectoryWillChange: async(session: Session) => {
        withNvmPath(session.directory, path => session.environment.path.remove(path));
    },
    presentWorkingDirectoryDidChange: async(session: Session, directory: string) => {
        withNvmPath(directory, path => session.environment.path.prepend(path));
    },
});
