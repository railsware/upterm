import {appendFileSync} from "fs";
import {historyFilePath} from "../utils/Common";
import * as csvStringify from "csv-stringify";
import {services} from "../services/index";

services.history.onNewRecord.subscribe(record => csvStringify(
    [Object.values(record)],
    (_error, output) => appendFileSync(historyFilePath, output),
));
