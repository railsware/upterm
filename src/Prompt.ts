import * as events from "events";
import Autocompletion from "./Autocompletion";
import {History, HistoryEntry} from "./History";
import * as _ from "lodash";
import * as i from "./Interfaces";
import {expandAliases, expandHistory, lex} from "./CommandExpander";
import Job from "./Job";

export default class Prompt extends events.EventEmitter {
    private _value = "";
    private _autocompletion = new Autocompletion();
    private _expanded: string[];
    private _lexemes: string[];
    private _historyExpanded: string[];

    constructor(private job: Job) {
        super();
    }

    execute(): void {
        History.add(new HistoryEntry(this.value, this._historyExpanded));
        this.emit("send");
    }

    get value(): string {
        return this._value;
    }

    set value(value: string) {
        this._value = value;

        this._lexemes = lex(this.value);
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
        return this.expanded.slice(-1)[0] || "";
    }

    get expanded(): string[] {
        return this._expanded;
    }

    get lexemes(): string[] {
        return this._lexemes;
    }

    get lastLexeme(): string {
        return _.last(this.lexemes) || "";
    }

    getSuggestions(): Promise<i.Suggestion[]> {
        return this._autocompletion.getSuggestions(this.job);
    }
}
