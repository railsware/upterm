import {appendFileSync} from "fs";
import {historyFilePath} from "../utils/Common";
import * as csvStringify from "csv-stringify";
import {services} from "../services/index";

services.sessions.afterJob.subscribe(job => services.history.add({
    command: job.prompt.value,
    expandedCommand: job.prompt.expandedTokens.map(t => t.escapedValue).join(" "),
    timestamp: job.startTime,
    directory: job.environment.pwd,
    sessionID: job.session.id,
}));

services.history.onNewRecord.subscribe(record => csvStringify(
    [Object.values(record)],
    (_error, output) => appendFileSync(historyFilePath, output),
));
