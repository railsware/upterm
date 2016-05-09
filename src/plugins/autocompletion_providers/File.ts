import {directoryAlias, fileInDirectoryGenerator} from "./Common";
import {choice, runtime, many1} from "../../Parser";

// TODO: shouldn't behave like that https://dl.dropboxusercontent.com/spa/dlqheu39w0arg9q/1t71rcbn.png
export const file = many1(
    runtime(
        async (context) => choice([directoryAlias].concat(await fileInDirectoryGenerator(context.directory, () => true)))
    )
);
