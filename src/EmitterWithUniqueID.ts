import * as events from "events";

export class EmitterWithUniqueID extends events.EventEmitter {
    public id: number;

    constructor() {
        super();
        this.id = Date.now();
    }
}
