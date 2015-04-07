/// <reference path="references.ts" />

var events = require('events');

module BlackScreen {
    export class EventEmitter implements NodeJS.EventEmitter {
        eventEmitter: any;

        constructor() {
            this.eventEmitter = new events.EventEmitter();
        }

        addListener(event: string, listener: Function): EventEmitter {
            this.eventEmitter.addListener(event, listener);
            return this;
        }

        on(event: string, listener: Function): EventEmitter {
            return this.addListener(event, listener);
        }

        once(event: string, listener: Function): EventEmitter {
            this.eventEmitter.once(event, listener);
            return this;
        }

        removeListener(event: string, listener: Function): EventEmitter {
            this.eventEmitter.removeListener(event, listener);
            return this;
        }

        removeAllListeners(event?: string): EventEmitter {
            this.eventEmitter.removeAllListeners(event);
            return this;
        }

        setMaxListeners(n: number): void {
            this.eventEmitter.setMaxListeners(n);
        }

        listeners(event: string): Function[] {
            return this.eventEmitter.listeners(event);
        }

        emit(event: string, ...args: any[]): boolean {
            debugger;
            return this.eventEmitter.emit.bind(this.eventEmitter, event).apply(this.eventEmitter, args);
        }
    }
}
