import {FontService} from "./FontService";
import {HistoryService} from "./HistoryService";
import {UpdatesService} from "./UpdatesService";
import {GitService} from "./GitService";
import {appendFileSync} from "fs";
import {historyFilePath} from "../utils/Common";
import * as csvStringify from "csv-stringify";

// To help IDE with "find usages" and "go to definition".
interface Services {
    font: FontService;
    history: HistoryService;
    updates: UpdatesService;
    git: GitService;
}

export const services: Services = {
    font: new FontService(),
    history: new HistoryService(),
    updates: new UpdatesService,
    git: new GitService(),
};

services.history.onChange(record => csvStringify(
    [Object.values(record)],
    (_error, output) => appendFileSync(historyFilePath, output),
));
