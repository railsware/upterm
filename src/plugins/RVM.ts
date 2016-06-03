import {Session} from "../Session";
import {PluginManager} from "../PluginManager";
import * as Path from "path";
import {homeDirectory, exists, readFile} from "../utils/Common";

const rvmDirectory = Path.join(homeDirectory, ".rvm");
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

function binPaths(rubyVersion: string, gemSetName: string): string[] {
    return [
        Path.join(rvmDirectory, "bin"),
        Path.join(rvmDirectory, "rubies", `ruby-${rubyVersion}`, "bin"),
        ...getGemSetPaths(rubyVersion, gemSetName).map(path => Path.join(path, "bin")),
    ];
}

async function withRvmData(directory: string, callback: (binPaths: string[], gemPaths: string[]) => void) {
    if (await isUnderRVM(directory)) {
        const rubyVersion = await getRubyVersion(directory);
        const gemSetName = await getGemSetName(directory);
        const gemPaths = getGemSetPaths(rubyVersion, gemSetName);
        callback(binPaths(rubyVersion, gemSetName), gemPaths);
    }
}

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: () => async(session: Session, directory: string) => {
        withRvmData(directory, binPaths => {
            binPaths.forEach(path => session.environment.path.remove(path));

            session.environment.setMany({
                GEM_PATH: "",
                GEM_HOME: "",
            });
        });
    },
    currentWorkingDirectoryDidChange: async(session: Session, directory: string) => {
        withRvmData(directory, (binPaths, gemPaths) => {
            binPaths.forEach(path => session.environment.path.prepend(path));

            session.environment.setMany({
                GEM_PATH: gemPaths.join(Path.delimiter),
                GEM_HOME: gemPaths[0],
            });
        });
    },
});
