import * as _ from 'lodash';

export class HistoryEntry {
    constructor(private _raw: string, private _historyExpanded: string[]) {}

    get raw(): string {
        return this._raw;
    }

    get historyExpanded(): string[] {
        return this._historyExpanded;
    }
}

export class History {
    static pointer: number = 0;
    private static maxEntriesCount = 100;
    private static storage: HistoryEntry[] = [];
    private static defaultEntry: HistoryEntry = new HistoryEntry('', []);

    static get all(): HistoryEntry[] {
        return this.storage;
    }

    static get last(): HistoryEntry {
        return this.at(0);
    }

    static lastWithPrefix(prefix: string): HistoryEntry {
        return this.find(entry => entry.raw.startsWith(prefix));
    }

    static at(position: number): HistoryEntry {
        const index = (position >= 0) ? (position + 1) : (this.count + position + 1);
        return this.storage[index] || this.defaultEntry;
    }

    static add(entry: HistoryEntry): void {
        this.remove(entry);
        this.storage.unshift(entry);

        if (this.count > this.maxEntriesCount) {
            this.storage.splice(this.maxEntriesCount - 1);
        }

        this.pointer = -1;
    }

    static getPrevious(): string {
        if (this.pointer < this.count) {
            this.pointer += 1;
        }

        return this.at(this.pointer).raw;
    }

    static getNext(): string {
        if (this.pointer >= 0) {
            this.pointer -= 1;
        }

        return this.at(this.pointer).raw;
    }

    private static get count(): number {
        return this.storage.length - 1;
    }

    static serialize(): string {
        return `History:${JSON.stringify(History.storage)}`;
    }

    static deserialize(serialized: string): void {
        //var stack: string[] = JSON.parse(serialized).reverse();
        //stack.forEach(item => this.add(item));
    }

    private static findIndex(entry: HistoryEntry): number {
        return _.findIndex(this.storage, stackedEntry => stackedEntry.raw === entry.raw);
    }

    private static remove(entry: HistoryEntry): void {
        const duplicateIndex = this.findIndex(entry);
        if (duplicateIndex !== -1) {
            this.storage.splice(duplicateIndex, 1);
        }
    }

    private static find(searcher: (he: HistoryEntry) => boolean): HistoryEntry {
        return _.find(this.storage, searcher);
    }
}

export default History;
