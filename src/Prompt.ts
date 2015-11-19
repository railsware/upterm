import * as events from 'events';
import Autocompletion from './Autocompletion';
import Buffer from './Buffer';
import Aliases from './Aliases';
import {History, HistoryEntry} from './History';
import * as _ from 'lodash';
import {expandAliases, expandHistory, lex} from './CommandExpander';

export default class Prompt extends events.EventEmitter {
    buffer: Buffer;
    private autocompletion = new Autocompletion();
    private _expanded: string[];
    private _lexemes: string[];
    private historyExpanded: string[];

    constructor(private directory: string) {
        super();

        this.buffer = new Buffer({ columns: 99999, rows: 99999 });
        this.buffer.on('data', () => {
            this._lexemes = lex(this.buffer.toString());
            this.historyExpanded = expandHistory(this._lexemes);
            this._expanded = expandAliases(this.historyExpanded);
        });
    }

    execute(): void {
        History.add(new HistoryEntry(this.buffer.toString(), this.historyExpanded));
        this.emit('send');
    }

    get commandName(): string {
        return this.expanded[0];
    }

    get arguments(): string[] {
        return this.expanded.slice(1);
    }

    get lastArgument(): string {
        return this.expanded.slice(-1)[0] || '';
    }

    get expanded(): string[] {
        return this._expanded;
    }

    get lexemes(): string[] {
        return this._lexemes;
    }

    get lastLexeme(): string {
        return _.last(this.lexemes) || '';
    }

    getSuggestions(): Promise<Suggestion[]> {
        return this.autocompletion.getSuggestions(this)
    }

    getCWD(): string {
        return this.directory;
    }

    // TODO: Now it's last lexeme instead of current.
    replaceCurrentLexeme(suggestion: Suggestion): void {
        var lexemes = _.clone(this._lexemes);
        lexemes[lexemes.length - 1] = `${suggestion.prefix || ""}${suggestion.value}`;

        this.buffer.setTo(lexemes.join(' '));
    }
}
