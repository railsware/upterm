import * as events from "events";
import {Job} from "./Job";
import {scan, Token} from "./shell/Scanner";
import {expandAliases} from "./shell/CommandExpander";

export class Prompt extends events.EventEmitter {
    private _value = "";
    private _tokens: Token[];
    private _expanded: Token[];

    constructor(private job: Job) {
        super();
    }

    get value(): string {
        return this._value;
    }

    setValue(value: string): void {
        this._value = value;
        this._tokens = scan(this.value);
        this._expanded = expandAliases(this._tokens, this.job.session.aliases);
    }

    get tokens(): Token[] {
        return this._tokens;
    }

    get expanded(): Token[] {
        return this._expanded;
    }

    get commandName(): Token {
        return this.expanded[0];
    }

    get arguments(): Token[] {
        return this.expanded.slice(1);
    }
}
