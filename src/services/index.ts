import {FontService} from "./FontService";
import {HistoryService} from "./HistoryService";
import {UpdatesService} from "./UpdatesService";
import {GitService} from "./GitService";
import {appendFileSync} from "fs";
import {historyFilePath} from "../utils/Common";
import * as csvStringify from "csv-stringify";
import {SessionsService} from "./SessionsService";

// To help IDE with "find usages" and "go to definition".
interface Services {
    font: FontService;
    history: HistoryService;
    updates: UpdatesService;
    git: GitService;
    sessions: SessionsService;
}

export const services: Services = {
    font: new FontService(),
    history: new HistoryService(),
    updates: new UpdatesService,
    git: new GitService(),
    sessions: new SessionsService(),
};

services.history.onChange(record => csvStringify(
    [Object.values(record)],
    (_error, output) => appendFileSync(historyFilePath, output),
));
