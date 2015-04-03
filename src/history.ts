export class History {
    stack:Array<string>;
    pointer:number;

    constructor(){
        this.stack = [];
        this.pointer = 0;
    }

    append(command:string):void {
        var duplicateIndex = this.stack.indexOf(command);

        if (duplicateIndex !== -1) {
            this.stack.splice(duplicateIndex, 1);
        }

        this.stack.push(command);
        this.pointer = this.stack.length;
    }

    previous():string {
        if (this.pointer > 0) {
            this.pointer -= 1;
        }

        return this.stack[this.pointer];
    }

    next():string {
        if (this.pointer < this.stack.length) {
            this.pointer += 1;
        }

        return this.stack[this.pointer];
    }
}
