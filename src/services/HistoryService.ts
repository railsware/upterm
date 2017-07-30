import {readFileSync} from "fs";
import {historyFilePath} from "../utils/Common";
const csvParse: any = require("csv-parse/lib/sync");
const csvStringify: any = require("csv-stringify/lib/sync");

export interface HistoryRecord {
    command: string;
    expandedCommand: string;
    timestamp: number;
    directory: string;
    sessionID: number;
}

const readHistoryFileData = (): HistoryRecord[] => {
    try {
        return csvParse(readFileSync(historyFilePath).toString()).map((array: string[]) => ({
            command: array[0],
            expandedCommand: array[1],
            timestamp: array[2],
            directory: array[3],
            sessionID: array[4],
        }));
    } catch (e) {
        return [];
    }
};

export class HistoryService {
    private static _instance: HistoryService;
    pointer: number = 0;
    private maxEntriesCount: number = 5000;
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

    add(entry: HistoryRecord): void {
        this.remove(entry);
        this.storage.unshift(entry);

        if (this.count > this.maxEntriesCount) {
            this.storage.splice(this.maxEntriesCount - 1);
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

    private remove(entry: HistoryRecord): void {
        const duplicateIndex = this.storage.indexOf(entry);
        if (duplicateIndex !== -1) {
            this.storage.splice(duplicateIndex, 1);
        }
    }
}
