import Session from "../Session";
import PluginManager from "../PluginManager";
import * as Path from "path";
import {homeDirectory, exists, readFile} from "../Utils";

const rvmDirectory = Path.join(homeDirectory(), ".rvm");
const rubyVersionFileName = ".ruby-version";
const gemSetNameFileName = ".ruby-gemset";

async function isUnderRVM(directory: string): Promise<boolean> {
    return await exists(Path.join(directory, rubyVersionFileName));
}

async function getRubyVersion(directory: string): Promise<string> {
    return (await readFile(Path.join(directory, rubyVersionFileName))).trim();
}

async function getGemSetName(directory: string): Promise<string> {
    const gemSetNameFilePath = Path.join(directory, gemSetNameFileName);

    if (await exists(gemSetNameFilePath)) {
        return (await readFile(gemSetNameFilePath)).trim();
    } else {
        return "global";
    }
}

/**
 * Contract: the non-global path should be first.
 */
function getGemSetPaths(rubyVersion: string, gemSetName: string): string[] {
    const names = gemSetName === "global" ? ["global"] : [gemSetName, "global"];
    return names.map(name => Path.join(rvmDirectory, "gems", `ruby-${rubyVersion}@${name}`));
}

function binPaths(rubyVersion: string, gemSetName: string): string {
    return [
        Path.join(rvmDirectory, "bin"),
        Path.join(rvmDirectory, "rubies", `ruby-${rubyVersion}`, "bin"),
        ...getGemSetPaths(rubyVersion, gemSetName).map(path => Path.join(path, "bin")),
    ].join(Path.delimiter);
}

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: () => void 0,
    currentWorkingDirectoryDidChange: async(session: Session) => {
        if (await isUnderRVM(session.directory)) {
            const rubyVersion = await getRubyVersion(session.directory);
            const gemSetName = await getGemSetName(session.directory);
            const gemPaths = getGemSetPaths(rubyVersion, gemSetName);
            const path = binPaths(rubyVersion, gemSetName) + Path.delimiter + session.environment.path;

            session.environment.setMany({
                PATH: path,
                GEM_PATH: gemPaths.join(Path.delimiter),
                GEM_HOME: gemPaths[0],
            });
        } else {
            const path = session.environment.path.split(Path.delimiter).filter(path => !path.includes(".rvm")).join(Path.delimiter);
            session.environment.setMany({PATH: path, GEM_HOME: "", GEM_PATH: ""});
        }
    },
});
