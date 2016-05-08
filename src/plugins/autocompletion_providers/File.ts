import {directoryAlias, fileInDirectoryGenerator} from "./Common";
import {choice, runtime, many1} from "../../Parser";

export const file = many1(
    runtime(
        async (context) => choice([directoryAlias].concat(await fileInDirectoryGenerator(context.directory, () => true)))
    )
);
