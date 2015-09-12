import * as events from 'events';
import Autocompletion from './Autocompletion';
import Buffer from './Buffer';
import Aliases from './Aliases';
import History from './History';
import * as _ from 'lodash';
import * as i from './Interfaces';
import ParsableString from './ParsableString';

export default class Prompt extends events.EventEmitter {
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
