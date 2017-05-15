import {Session} from "../shell/Session";
import {PluginManager} from "../PluginManager";
import * as Path from "path";
import * as fs from "fs";
import {homeDirectory, io} from "../utils/Common";

const rvmDirectory = Path.join(homeDirectory, ".rvm");
const rubyVersionFileName = ".ruby-version";
const gemSetNameFileName = ".ruby-gemset";

async function getRubyVersion(directory: string): Promise<string> {
    if (await io.exists(Path.join(directory, rubyVersionFileName))) {
        return (await io.readFile(Path.join(directory, rubyVersionFileName))).trim();
    } else {
        return new Promise<string>((resolve, reject) => {
            fs.realpath(Path.join(rvmDirectory, "rubies", "default"), (err, resolvedPath) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resolvedPath.split("-")[1]);
                }
            });
        });
    }
}

async function getGemSetName(directory: string): Promise<string> {
    const gemSetNameFilePath = Path.join(directory, gemSetNameFileName);

    if (await io.exists(gemSetNameFilePath)) {
        return (await io.readFile(gemSetNameFilePath)).trim();
    } else {
        return "global";
    }
}

/**
 * Contract: the non-global path should be first.
 */
function getGemSetPaths(rubyVersion: string, gemSetName: string): string[] {
    const suffixes = gemSetName === "global" ? ["", "@global"] : [`@${gemSetName}`, "@global"];
    return suffixes.map(suffix => Path.join(rvmDirectory, "gems", `ruby-${rubyVersion}${suffix}`));
}

function binPaths(rubyVersion: string, gemSetName: string): string[] {
    return [
        Path.join(rvmDirectory, "bin"),
        Path.join(rvmDirectory, "rubies", `ruby-${rubyVersion}`, "bin"),
        ...getGemSetPaths(rubyVersion, gemSetName).map(path => Path.join(path, "bin")),
    ];
}

async function withRvmData(directory: string, callback: (binPaths: string[], gemPaths: string[]) => void) {
    try {
        const rubyVersion = await getRubyVersion(directory);
        const gemSetName = await getGemSetName(directory);
        const gemPaths = getGemSetPaths(rubyVersion, gemSetName);

        callback(binPaths(rubyVersion, gemSetName), gemPaths);
    } catch (e) {
        if (e.code === "ENOENT") {
            // No RVM installed. Ignore exception.
        } else {
            throw e;
        }
    }
}

PluginManager.registerEnvironmentObserver({
    presentWorkingDirectoryWillChange: () => async(session: Session, directory: string) => {
        withRvmData(directory, binPaths => {
            binPaths.forEach(path => session.environment.path.remove(path));

            session.environment.setMany({
                GEM_PATH: "",
                GEM_HOME: "",
            });
        });
    },
    presentWorkingDirectoryDidChange: async(session: Session, directory: string) => {
        withRvmData(directory, (binPaths, gemPaths) => {
            binPaths.forEach(path => session.environment.path.prepend(path));

            session.environment.setMany({
                GEM_PATH: gemPaths.join(Path.delimiter),
                GEM_HOME: gemPaths[0],
            });
        });
    },
});
