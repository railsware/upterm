import * as events from "events";
import {Job} from "./Job";
import {scan, Token, withoutEndOfInput} from "./shell/Scanner";
import {expandAliases} from "./shell/CommandExpander";

export class Prompt extends events.EventEmitter {
    private _value = "";
    private _tokens: Token[];
    private _expanded: string[];

    constructor(private job: Job) {
        super();
    }

    get value(): string {
        return this._value;
    }

    setValue(value: string): void {
        this._value = value;
        this._tokens = scan(this.value);
        this._expanded = withoutEndOfInput(expandAliases(this._tokens, this.job.session.aliases)).map(token => token.value);
    }

    get expanded(): string[] {
        return this._expanded;
    }

    get commandName(): string {
        return this.expanded[0];
    }

    get arguments(): string[] {
        return this.expanded.slice(1);
    }
}
