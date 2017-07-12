import {readFileSync, statSync} from "fs";
import {flatten, orderBy} from "lodash";
import {loginShell} from "../utils/Shell";
import {historyFilePath} from "../utils/Common";
import * as _ from "lodash";

const readHistoryFileData = () => {
    try {
        return {
            lastModified: statSync(historyFilePath).mtime,
            commands: JSON.parse(readFileSync(historyFilePath).toString()),
        };
    } catch (e) {
        return {
            lastModified: new Date(0),
            commands: [],
        };
    }
};

export class History {
    static pointer: number = 0;
    private static maxEntriesCount: number = 5000;
    private static storage: string[] = [];
    private static defaultEntry = "";

    static get all(): string[] {
        return this.storage;
    }

    static get latest(): string {
        return this.at(-1);
    }

    static at(position: number): string {
        if (position === 0) {
            return this.defaultEntry;
        }

        if (position < 0) {
            return this.storage[-(position + 1)] || this.defaultEntry;
        }

        return this.storage[this.count - 1] || this.defaultEntry;
    }

    static add(entry: string): void {
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

        return this.at(-this.pointer);
    }

    static getNext(): string {
        if (this.pointer > 0) {
            this.pointer -= 1;
        }

        return this.at(-this.pointer);
    }

    private static get count(): number {
        return this.storage.length;
    }

    static serialize(): string {
        return JSON.stringify(History.storage);
    }

    static deserialize(): void {
        this.storage = _.uniq(flatten(orderBy([loginShell.loadHistory(), readHistoryFileData()], history => history.lastModified, "desc").map(history => history.commands)));
    }

    private static remove(entry: string): void {
        const duplicateIndex = this.storage.indexOf(entry);
        if (duplicateIndex !== -1) {
            this.storage.splice(duplicateIndex, 1);
        }
    }
}
