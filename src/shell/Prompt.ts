import * as events from "events";
import {Job} from "./Job";
import {scan, Token, expandAliases} from "./Scanner";
import {ASTNode, CompleteCommand} from "./Parser";

export class Prompt extends events.EventEmitter {
    private _value = "";
    private _ast: CompleteCommand;
    private _expandedAst: CompleteCommand;

    constructor(private job: Job) {
        super();
    }

    get value(): string {
        return this._value;
    }

    setValue(value: string): void {
        this._value = value;

        const tokens = scan(this.value);
        this._ast = new CompleteCommand(tokens);
        this._expandedAst = new CompleteCommand(expandAliases(tokens, this.job.session.aliases));
    }

    get ast(): ASTNode {
        return this._ast;
    }

    get expandedTokens(): Token[] {
        return this._expandedAst.tokens;
    }

    get commandName(): string {
        if (!this._expandedAst || !this._expandedAst.firstCommand.commandWord) {
            return "";
        }
        return this._expandedAst.firstCommand.commandWord.value;
    }

    get arguments(): Token[] {
        const argumentList = this._expandedAst.firstCommand.argumentList;

        if (argumentList) {
            return argumentList.tokens;
        } else {
            return [];
        }
    }
}
