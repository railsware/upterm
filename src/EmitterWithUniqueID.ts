import * as events from "events";

let nextId = 0;

export class EmitterWithUniqueID extends events.EventEmitter {
    public id: number;

    constructor() {
        super();
        this.id = nextId;
        nextId++;
    }
}
