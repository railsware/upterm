import Session from "../Session";
import PluginManager from "../PluginManager";
import Utils from "../Utils";
import * as Path from "path";

const rvmDirectory = Path.join(Utils.homeDirectory, ".rvm");
const rubyVersionFileName = ".ruby-version";
const gemSetNameFileName = ".ruby-gemset";

async function isUnderRVM(directory: string): Promise<boolean> {
    return await Utils.exists(Path.join(directory, rubyVersionFileName));
}

/**
 * Contract: the non-global path should be first.
 */
async function gemSetPaths(directory: string, rubyVersion: string): Promise<string[]> {
    const gemSetNameFilePath = Path.join(directory, gemSetNameFileName);

    const paths = [Path.join(rvmDirectory, "gems", `ruby-${rubyVersion}@global`)];

    if (await Utils.exists(gemSetNameFilePath)) {
        const gemSetName = (await Utils.readFile(gemSetNameFilePath)).trim();
        paths.unshift(Path.join(rvmDirectory, "gems", `ruby-${rubyVersion}@${gemSetName}`));
    }

    return paths;
}

async function binPaths(directory: string, rubyVersion: string): Promise<string> {
    return [
        Path.join(rvmDirectory, "bin"),
        Path.join(rvmDirectory, "rubies", `ruby-${rubyVersion}`, "bin"),
        ...(await gemSetPaths(directory, rubyVersion)).map(path => Path.join(path, "bin")),
    ].join(Path.delimiter);
}

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: async(session: Session) => {
        if (await isUnderRVM(session.directory)) {
            session.environment.set("PATH", session.environment.path.split(Path.delimiter).filter(path => !path.includes(".rvm")).join(Path.delimiter));
            session.environment.set("GEM_HOME", "");
            session.environment.set("GEM_PATH", "");
        }
    },
    currentWorkingDirectoryDidChange: async (session: Session) => {
        if (await isUnderRVM(session.directory)) {
            const rubyVersion = (await Utils.readFile(Path.join(session.directory, rubyVersionFileName))).trim();

            const paths = await gemSetPaths(session.directory, rubyVersion);
            session.environment.set("PATH", await binPaths(session.directory, rubyVersion) + Path.delimiter + session.environment.path);
            session.environment.set("GEM_PATH", paths.join(Path.delimiter));
            session.environment.set("GEM_HOME", paths[0]);
        }
    },
});
