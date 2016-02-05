import * as events from "events";
import Autocompletion from "./Autocompletion";
import {History, HistoryEntry} from "./History";
import * as _ from "lodash";
import {expandAliases, expandHistory, lex} from "./CommandExpander";
import Job from "./Job";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";

export default class Prompt extends events.EventEmitter {
    private _value = "";
    private _autocompletion = new Autocompletion();
    private _expanded: string[];
    private _expandedFinishedLexemes: string[];
    private _lexemes: string[];
    private _historyExpanded: string[];

    constructor(private job: Job) {
        super();
    }

    execute(): void {
        History.add(new HistoryEntry(this.value, this._historyExpanded));
        this.job.execute();
    }

    get value(): string {
        return this._value;
    }

    async setValue(value: string): Promise<void> {
        this._value = value;

        this._lexemes = lex(this.value);
        this._historyExpanded = await expandHistory(this._lexemes);
        this._expanded = await expandAliases(this._historyExpanded);
        this._expandedFinishedLexemes = await expandAliases(expandHistory(lex(this.value).slice(0, -1)));
    }

    get commandName(): string {
        return this.expanded[0];
    }

    get arguments(): string[] {
        return this.expanded.slice(1);
    }

    get lastArgument(): string {
        return this.expanded.slice(-1)[0] || "";
    }

    get expanded(): string[] {
        return this._expanded;
    }

    get expandedFinishedLexemes(): string[] {
        return this._expandedFinishedLexemes;
    }

    get lexemes(): string[] {
        return this._lexemes;
    }

    get lastLexeme(): string {
        return _.last(this.lexemes) || "";
    }

    getSuggestions(): Promise<Suggestion[]> {
        return this._autocompletion.getSuggestions(this.job);
    }
}
