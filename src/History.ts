class History {
    static pointer: number = 0;
    static stack: Array<string> = [];

    static append(command: string): void {
        var duplicateIndex = this.stack.indexOf(command);

        if (duplicateIndex !== -1) {
            this.stack.splice(duplicateIndex, 1);
        }

        this.stack.push(command);
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
}

export = History;
