import * as _ from 'lodash';

export class HistoryEntry {
    constructor(private _raw: string, private _expanded: string[], private startTime: number, private endTime: number) {}

    get raw(): string {
        return this._raw;
    }

    get expanded(): string[] {
        return this._expanded;
    }
}

// Stack-like data structure with random access and default.
class Storage {
    private maxEntriesCount = 100;
    private storage: HistoryEntry[] = [];
    private defaultEntry: HistoryEntry = new HistoryEntry('', [], 0, 0);

    private findIndex(entry: HistoryEntry): number {
        return _.findIndex(this.storage, stackedEntry => stackedEntry.raw === entry.raw);
    }

    private remove(entry: HistoryEntry): void {
        const duplicateIndex = this.findIndex(entry);
        if (duplicateIndex !== -1) {
            this.storage.splice(duplicateIndex, 1);
        }
    }

    get all(): HistoryEntry[] {
        return this.storage;
    }

    get count(): number {
        return this.storage.length - 1;
    }

    add(entry: HistoryEntry): void {
        this.remove(entry);
        this.storage.unshift(entry);

        if (this.count > this.maxEntriesCount) {
            this.storage.splice(this.maxEntriesCount - 1);
        }
    }

    find(searcher: (he: HistoryEntry) => boolean): HistoryEntry {
        return _.find(this.storage, searcher);
    }

    at(position: number): HistoryEntry {
        return this.storage[position] || this.defaultEntry;
    }
}

export class History {
    static pointer: number = 0;
    static storage = new Storage();

    static add(entry: HistoryEntry): void {
        this.storage.add(entry);
        this.pointer = -1;
    }

    static get all(): HistoryEntry[] {
        return this.storage.all;
    }

    static at(position: number): string {
        // TODO: handle cases when the index is outside of stack.
        const index = (position >= 0) ? (position + 1) : (this.storage.count + position + 1);
        return this.storage.at(index).raw;
    }

    static get last(): HistoryEntry {
        return this.storage.at(0);
    }

    static lastWithPrefix(prefix: string): string {
        return this.storage.find(entry => entry.raw.startsWith(prefix)).raw;
    }

    static getPrevious(): string {
        if (this.pointer < this.storage.count) {
            this.pointer += 1;
        }

        return this.storage.at(this.pointer).raw;
    }

    static getNext(): string {
        if (this.pointer >= 0) {
            this.pointer -= 1;
        }

        return this.storage.at(this.pointer).raw;
    }

    serialize(): string {
        return `History:${JSON.stringify(History.storage)}`;
    }

    static deserialize(serialized: string): void {
        //var stack: string[] = JSON.parse(serialized).reverse();
        //stack.forEach(item => this.add(item));
    }
}

export default History;
