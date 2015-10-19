import * as events from 'events';
import Autocompletion from './Autocompletion';
import Buffer from './Buffer';
import Aliases from './Aliases';
import {History, HistoryEntry} from './History';
import * as _ from 'lodash';
import * as i from './Interfaces';
import ParsableString from './CommandExpander';

export default class Prompt extends events.EventEmitter {
    buffer: Buffer;
    private autocompletion = new Autocompletion();
    private expanded: string[];
    private _parsableString: ParsableString;
    private startTime: number;

    constructor(private directory: string) {
        super();

        this.buffer = new Buffer({columns: 99999, rows: 99999});
        this.buffer.on('data', () => {
            this.parsableString = new ParsableString(this.buffer.toString());
            this.expanded = this.parsableString.expand();
        });
    }

    execute(): void {
        this.startTime = Date.now();
        this.emit('send');
    }

    onEnd(): void {
        History.add(new HistoryEntry(this.buffer.toString(), this.expanded, this.startTime, Date.now()));
    }

    get commandName(): string {
        return this.commandWithArguments[0];
    }

    get arguments(): string[] {
        return this.commandWithArguments.slice(1);
    }

    get lastArgument(): string {
        return this.commandWithArguments.slice(-1)[0] || '';
    }

    get commandWithArguments(): string[] {
        return this.expanded;
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

    // TODO: Now it's last lexeme instead of current.
    replaceCurrentLexeme(suggestion: i.Suggestion): void {
        var lexemes = this.parsableString.lexemes;
        lexemes[lexemes.length - 1] = `${suggestion.prefix || ""}${suggestion.value}`;

        this.buffer.setTo(lexemes.join(' '));
    }

    get parsableString(): ParsableString {
        return this._parsableString;
    }

    set parsableString(value: ParsableString) {
        this._parsableString = value;
    }
}
