export default class History {
    static historySize = 100;
    static pointer: number = 0;
    static stack: Array<string> = [];

    static add(command: string): void {
        var duplicateIndex = this.stack.indexOf(command);

        if (duplicateIndex !== -1) {
            this.stack.splice(duplicateIndex, 1);
        }

        this.stack.unshift(command);

        if (this.size() > this.historySize) {
            this.stack.splice(this.historySize);
        }

        this.pointer = -1;
    }

    static get last(): string {
        return this.stack[0];
    }

    static getPrevious(): string {
        if (this.pointer < this.stack.length - 1) {
            this.pointer += 1;
        }

        return this.stack[this.pointer];
    }

    static getNext(): string {
        if (this.pointer >= 0) {
            this.pointer -= 1;
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
        var stack: string[] = JSON.parse(serialized).reverse();
        stack.forEach(item => this.add(item));
    }
}
