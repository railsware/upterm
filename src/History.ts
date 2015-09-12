export default class History {
    static historySize = 1000;
    static pointer: number = 0;
    static stack: Array<string> = [];

    static append(command: string): void {
        var duplicateIndex = this.stack.indexOf(command);

        if (duplicateIndex !== -1) {
            this.stack.splice(duplicateIndex, 1);
        }

        this.stack.push(command);

        if (this.size() > this.historySize) {
            this.stack.splice(0, this.stack.length - this.historySize); // Delete ancient history.
        }

        this.pointer = this.stack.length;
    }

    static getPrevious(): string {
        if (this.pointer > 0) {
            this.pointer -= 1;
        }

        return this.stack[this.pointer];
    }

    static getNext(): string {
        if (this.pointer < this.stack.length) {
            this.pointer += 1;
        }

        return this.stack[this.pointer];
    }

    static size(): number {
        return this.stack.length;
    }

    static clear(): void {
        this.stack = [];
    }

    serialize(): string {
        return `History:${JSON.stringify(History.stack)}`;
    }

    static deserialize(serialized: string): void {
        var stack: string[] = JSON.parse(serialized);
        stack.forEach(item => this.append(item));
    }
}
