import * as events from "events";
import {History, HistoryEntry} from "./History";
import * as _ from "lodash";
import {expandAliases, expandHistory, lex} from "./CommandExpander";
import Job from "./Job";

export default class Prompt extends events.EventEmitter {
    private _value = "";
    private _expanded: string[];
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
        this._historyExpanded = expandHistory(this._lexemes);
        this._expanded = await expandAliases(this._historyExpanded);
    }

    get commandName(): string {
        return this.expanded[0];
    }

    get arguments(): string[] {
        return this.expanded.slice(1);
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
}
