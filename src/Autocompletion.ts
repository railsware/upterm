//TODO: Make them accessible as providers.command.Path.
import Path = require('./providers/command/Path');
import _ = require('lodash');

class Autocompletion {
    pathCompletions: Path;

    constructor() {
        this.pathCompletions = new Path();
    }

    getCompletions(): Array<string> {
        return this.pathCompletions.executables;
    }

    matching(string: string): Array<string> {
        return _.filter(this.getCompletions(), (completion: string) => {
            return completion.startsWith(string);
        })
    }
}

export = Autocompletion;
