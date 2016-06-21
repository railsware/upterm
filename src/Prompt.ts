import * as events from "events";
import {Job} from "./Job";
import {scan, Token} from "./shell/Scanner";
import {expandAliases} from "./shell/CommandExpander";
import {ASTNode, parse, CompleteCommand, EmptyNode} from "./shell/Parser2";

export class Prompt extends events.EventEmitter {
    private _value = "";
    private _ast: EmptyNode | CompleteCommand;
    private _expanded: Token[];

    constructor(private job: Job) {
        super();
    }

    get value(): string {
        return this._value;
    }

    setValue(value: string): void {
        this._value = value;

        const tokens = scan(this.value);
        this._ast = parse(tokens);
        this._expanded = expandAliases(tokens, this.job.session.aliases);
    }

    get ast(): ASTNode {
        return this._ast;
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
