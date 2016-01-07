import * as events from 'events';
import Autocompletion from './Autocompletion';
import Buffer from './Buffer';
import Aliases from './Aliases';
import {History, HistoryEntry} from './History';
import * as _ from 'lodash';
import {expandAliases, expandHistory, lex} from './CommandExpander';
import Job from "./Job";

export default class Prompt extends events.EventEmitter {
    private _rawInput = '';
    private _autocompletion = new Autocompletion();
    private _expanded: string[];
    private _lexemes: string[];
    private _historyExpanded: string[];

    constructor(private job: Job) {
        super();
    }

    execute(): void {
        History.add(new HistoryEntry(this.rawInput, this._historyExpanded));
        this.emit('send');
    }

    get rawInput(): string {
        return this._rawInput;
    }

    set rawInput(value: string) {
        this._rawInput = value;

        this._lexemes = lex(this.rawInput);
        this._historyExpanded = expandHistory(this._lexemes);
        this._expanded = expandAliases(this._historyExpanded);
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
        return this._autocompletion.getSuggestions(this.job)
    }

    // TODO: Now it's last lexeme instead of current.
    replaceCurrentLexeme(suggestion: Suggestion): void {
        var lexemes = _.clone(this._lexemes);
        lexemes[lexemes.length - 1] = `${suggestion.prefix || ""}${suggestion.value}`;

        this.rawInput = lexemes.join(' ');
    }
}
