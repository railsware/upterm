import {readFileSync} from "fs";
import {historyFilePath} from "../utils/Common";
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
    pointer: number = 0;
    private maxRecordsCount: number = 5000;
    private storage: HistoryRecord[] = [];

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
        return this.at(-1);
    }

    add(record: HistoryRecordWithoutID): void {
        this.storage.unshift({id: this.nextID, ...record});

        if (this.count > this.maxRecordsCount) {
            this.storage.splice(this.maxRecordsCount - 1);
        }

        this.pointer = 0;
    }

    getPrevious(): HistoryRecord | undefined {
        if (this.pointer < this.count) {
            this.pointer += 1;
        }

        return this.at(-this.pointer);
    }

    getNext(): HistoryRecord | undefined {
        if (this.pointer > 0) {
            this.pointer -= 1;
        }

        return this.at(-this.pointer);
    }

    serialize(): string {
        return csvStringify(this.all.map(record => Object.values(record)));
    }

    deserialize(): void {
        this.storage = readHistoryFileData();
    }

    private get count(): number {
        return this.storage.length;
    }

    private at(position: number): HistoryRecord | undefined {
        if (position < 0) {
            return this.storage[-(position + 1)];
        }

        return this.storage[this.count - 1];
    }

    private get nextID(): number {
        if (this.latest) {
            return this.latest.id + 1;
        } else {
            return 1;
        }
    }
}
