import {lex} from "./CommandExpander";
import * as _ from "lodash";

export class HistoryEntry {
    private _raw: string;

    constructor(raw: string, private _historyExpanded: string[]) {
        this._raw = raw.trim().replace(/\s+/g, " ");
    }

    get raw(): string {
        return this._raw;
    }

    get historyExpanded(): string[] {
        return this._historyExpanded;
    }

    get lastLexeme(): string {
        return _.last(lex(this.raw));
    }

    toArray(): any[] {
        return [this.raw, this.historyExpanded];
    }
}

export class History {
    static pointer: number = 0;
    private static maxEntriesCount: number = 100;
    private static storage: HistoryEntry[] = [];
    private static defaultEntry: HistoryEntry = new HistoryEntry("", []);

    static get all(): HistoryEntry[] {
        return this.storage;
    }

    static get lastEntry(): HistoryEntry {
        return this.at(-1);
    }

    static lastWithPrefix(prefix: string): HistoryEntry {
        return this.storage.find(entry => entry.raw.startsWith(prefix)) || this.defaultEntry;
    }

    static at(position: number): HistoryEntry {
        if (position === 0) {
            return this.defaultEntry;
        }

        if (position < 0) {
            return this.storage[-(position + 1)] || this.defaultEntry;
        }

        return this.storage[this.count - 1] || this.defaultEntry;
    }

    static add(entry: HistoryEntry): void {
        this.remove(entry);
        this.storage.unshift(entry);

        if (this.count > this.maxEntriesCount) {
            this.storage.splice(this.maxEntriesCount - 1);
        }

        this.pointer = 0;
    }

    static getPrevious(): string {
        if (this.pointer < this.count) {
            this.pointer += 1;
        }

        return this.at(-this.pointer).raw;
    }

    static getNext(): string {
        if (this.pointer > 0) {
            this.pointer -= 1;
        }

        return this.at(-this.pointer).raw;
    }

    private static get count(): number {
        return this.storage.length;
    }

    static serialize(): string {
        return `History:${JSON.stringify(History.storage.map(entry => entry.toArray()))}`;
    }

    static deserialize(serialized: string): void {
        this.storage = JSON.parse(serialized).map((entry: any[]) => {
            let raw: string = entry[0];
            let historyExpanded: string[] = entry[1];

            return new HistoryEntry(raw, historyExpanded);
        });
    }

    private static remove(entry: HistoryEntry): void {
        const duplicateIndex = this.storage.findIndex(stackedEntry => stackedEntry.raw === entry.raw);
        if (duplicateIndex !== -1) {
            this.storage.splice(duplicateIndex, 1);
        }
    }
}
