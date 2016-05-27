import {executable, sequence, decorate, string, noisySuggestions, runtime, choice} from "../../Parser";
import {directoryAlias, fileInDirectoryGenerator} from "./Common";
import {expandHistoricalDirectory} from "../../Command";
import {description, styles, style} from "./Suggestions";
import * as _ from "lodash";

const historicalDirectory = runtime(async (context) =>
    noisySuggestions(
        decorate(
            choice(
                _.take(["-", "-2", "-3", "-4", "-5", "-6", "-7", "-8", "-9"], context.historicalCurrentDirectoriesStack.length - 1)
                    .map(alias => decorate(string(alias), description(expandHistoricalDirectory(alias, context.historicalCurrentDirectoriesStack))))
            ),
            style(styles.directory)
        )
    )
);

const cdpathDirectory = runtime(
    async (context) => {
        const directoriesToBe = context.environment.cdpath(context.directory).map(async (directory) => {
            const file = await fileInDirectoryGenerator(directory, info => info.stat.isDirectory());

            if (directory === context.directory) {
                return file;
            } else {
                return noisySuggestions(decorate(file, description(`In ${directory}`)));
            }
        });

        return choice(await Promise.all(directoriesToBe));
    }
);

export const cd = sequence(executable("cd"), choice([
    historicalDirectory,
    directoryAlias,
    cdpathDirectory,
]));
