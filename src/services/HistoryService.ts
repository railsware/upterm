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
    static pointer: number = 0;
    private static maxEntriesCount: number = 5000;
    private static storage: HistoryRecord[] = [];

    static get all(): HistoryRecord[] {
        return this.storage;
    }

    static get latest(): HistoryRecord | undefined {
        return this.at(-1);
    }

    static add(entry: HistoryRecord): void {
        this.remove(entry);
        this.storage.unshift(entry);

        if (this.count > this.maxEntriesCount) {
            this.storage.splice(this.maxEntriesCount - 1);
        }

        this.pointer = 0;
    }

    static getPrevious(): HistoryRecord | undefined {
        if (this.pointer < this.count) {
            this.pointer += 1;
        }

        return this.at(-this.pointer);
    }

    static getNext(): HistoryRecord | undefined {
        if (this.pointer > 0) {
            this.pointer -= 1;
        }

        return this.at(-this.pointer);
    }

    static serialize(): string {
        return csvStringify(HistoryService.storage.map(record => Object.values(record)));
    }

    static deserialize(): void {
        this.storage = readHistoryFileData();
    }

    private static get count(): number {
        return this.storage.length;
    }

    private static at(position: number): HistoryRecord | undefined {
        if (position < 0) {
            return this.storage[-(position + 1)];
        }

        return this.storage[this.count - 1];
    }

    private static remove(entry: HistoryRecord): void {
        const duplicateIndex = this.storage.indexOf(entry);
        if (duplicateIndex !== -1) {
            this.storage.splice(duplicateIndex, 1);
        }
    }
}
