import Invocation = require('../Invocation');

class Base {
    constructor(protected invocation: Invocation) {
    }

    decorate(): any {
        throw new Error('This method should be implemented in a subclass');
    }

    isApplicable(): boolean {
        throw new Error('This method should be implemented in a subclass');
    }
}

export = Base;
