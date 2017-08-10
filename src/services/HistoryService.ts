import {readFileSync} from "fs";
import {historyFilePath} from "../utils/Common";
import * as _ from "lodash";

import csvParse = require("csv-parse/lib/sync");
import {SessionID} from "../shell/Session";
import {Subject} from "rxjs/Subject";

interface HistoryRecordWithoutID {
    command: string;
    expandedCommand: string;
    timestamp: number;
    directory: string;
    sessionID: SessionID;
}

export interface HistoryRecord extends HistoryRecordWithoutID {
    id: number;
}

const readHistoryFileData = (): HistoryRecord[] => {
    try {
        return csvParse(readFileSync(historyFilePath).toString()).map((array: string[]) => ({
            id: Number.parseInt(array[0]),
            command: array[1],
            expandedCommand: array[2],
            timestamp: Number.parseInt(array[3]),
            directory: array[4],
            sessionID: Number.parseInt(array[5]),
        }));
    } catch (e) {
        return [];
    }
};

export class HistoryService {
    readonly onNewRecord = new Subject<HistoryRecord>();
    private maxRecordsCount: number = 5000;
    private storage: HistoryRecord[] = [];

    constructor() {
        this.storage = readHistoryFileData();
    }

    get all(): HistoryRecord[] {
        return this.storage;
    }

    get latest(): HistoryRecord | undefined {
        return _.last(this.storage);
    }

    add(recordWithoutID: HistoryRecordWithoutID): void {
        const record = {id: this.nextID, ...recordWithoutID};
        this.storage.push(record);

        if (this.storage.length > this.maxRecordsCount) {
            this.storage.shift();
        }

        this.onNewRecord.next(record);
    }

    getPreviousTo(currentRecordID: number): HistoryRecord | undefined {
        const currentRecordIndex = this.all.findIndex(record => record.id === currentRecordID);
        return this.storage[currentRecordIndex - 1];
    }

    getNextTo(currentRecordID: number): HistoryRecord | undefined {
        const currentRecordIndex = this.all.findIndex(record => record.id === currentRecordID);
        return this.storage[currentRecordIndex + 1];
    }

    private get nextID(): number {
        if (this.latest) {
            return this.latest.id + 1;
        } else {
            return 1;
        }
    }
}
