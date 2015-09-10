import events = require('events');
import Autocompletion = require('./Autocompletion');
import Buffer = require('./Buffer');
import Aliases = require('./Aliases');
import History = require('./History');
import _ = require('lodash');
import i = require('./Interfaces');
import ParsableString = require('./ParsableString');

class Prompt extends events.EventEmitter {
    buffer: Buffer;
    // TODO: change the type.
    history: any;
    private autocompletion = new Autocompletion();
    private commandParts: string[];

    constructor(private directory: string) {
        super();

        this.buffer = new Buffer({columns: 99999, rows: 99999});
        this.buffer.on('data', () => { this.commandParts = this.toParsableString().expandToArray(); });
        this.history = History;
    }

    execute(): void {
        this.history.append(this.buffer.toString());
        this.emit('send');
    }

    getCommandName(): string {
        return this.getWholeCommand()[0];
    }

    getArguments(): string[] {
        return this.getWholeCommand().slice(1);
    }

    getLastArgument(): string {
        return this.getWholeCommand().slice(-1)[0] || '';
    }

    getWholeCommand(): string[] {
        return this.commandParts;
    }

    getSuggestions(): Promise<i.Suggestion[]> {
        return this.autocompletion.getSuggestions(this)
    }

    getCWD(): string {
        return this.directory;
    }

    getBuffer(): Buffer {
        return this.buffer;
    }

    replaceCurrentLexeme(suggestion: i.Suggestion): void {
        var lexemes = this.toParsableString().getLexemes();
        lexemes[lexemes.length - 1] = `${suggestion.prefix || ""}${suggestion.value}`;

        this.buffer.setTo(lexemes.join(' '));
    }

    toParsableString(): ParsableString {
        return new ParsableString(this.buffer.toString());
    }
}

export = Prompt;
