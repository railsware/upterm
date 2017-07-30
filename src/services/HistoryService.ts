import {readFileSync} from "fs";
import {historyFilePath} from "../utils/Common";
import {outputFile} from "fs-extra";
import * as _ from "lodash";

const csvParse: any = require("csv-parse/lib/sync");
const csvStringify: any = require("csv-stringify/lib/sync");

interface HistoryRecordWithoutID {
    command: string;
    expandedCommand: string;
    timestamp: number;
    directory: string;
    sessionID: number;
}

interface HistoryRecord extends HistoryRecordWithoutID {
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
    private static _instance: HistoryService;
    private maxRecordsCount: number = 5000;
    private storage: HistoryRecord[] = [];
    private listeners: Array<(record: HistoryRecord) => void> = [];

    static get instance() {
        if (!this._instance) {
            this._instance = new HistoryService();
        }

        return this._instance;
    }

    get all(): HistoryRecord[] {
        return this.storage;
    }

    get latest(): HistoryRecord | undefined {
        return _.last(this.storage);
    }

    add(recordWithoutID: HistoryRecordWithoutID): void {
        const record = {id: this.nextID, ...recordWithoutID};
        this.storage.unshift(record);

        if (this.storage.length > this.maxRecordsCount) {
            this.storage.splice(this.maxRecordsCount - 1);
        }

        this.listeners.forEach(listener => listener(record));
    }

    getPreviousTo(currentRecordID: number): HistoryRecord | undefined {
        const currentRecordIndex = this.all.findIndex(record => record.id === currentRecordID);
        return this.storage[currentRecordIndex + 1];
    }

    getNextTo(currentRecordID: number): HistoryRecord | undefined {
        const currentRecordIndex = this.all.findIndex(record => record.id === currentRecordID);
        return this.storage[currentRecordIndex - 1];
    }

    serialize(): string {
        return csvStringify(this.all.map(record => Object.values(record)));
    }

    onChange(callback: (record: HistoryRecord) => void) {
        this.listeners.push(callback);
    }

    private constructor() {
        this.storage = readHistoryFileData();
    }

    private get nextID(): number {
        if (this.latest) {
            return this.latest.id + 1;
        } else {
            return 1;
        }
    }
}

HistoryService.instance.onChange(_record => outputFile(historyFilePath, HistoryService.instance.serialize()));
