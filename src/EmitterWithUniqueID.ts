import * as events from 'events';

export default class EmitterWithUniqueID extends events.EventEmitter {
    public id: number;

    constructor() {
        super();
        this.id = new Date().getTime();
    }
}
