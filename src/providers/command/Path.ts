import Base = require('Base');
import Utils = require('../Utils');

class Path extends Base {
    private paths: Array<string> = process.env.PATH.split(':');

    constructor() {
        super();

        this.paths.forEach((path) => {
            Utils.filesIn(path, (files) => {
                var executableNames = files.map((fileName) => {
                    return fileName.split('/').pop();
                });

                this.executables = this.executables.concat(executableNames);
            })
        });
    }
}

export = Path;
