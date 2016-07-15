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

    // FIXME: Rename to expandedTokens.
    get expanded(): Token[] {
        return this._expandedAst.childTokens;
    }

    get commandName(): string {
        const commandWord = this._expandedAst.firstCommand.commandWord;

        if (commandWord) {
            return commandWord.value;
        } else {
            return "";
        }
    }

    // FIXME: Return arguments.
    get arguments(): Token[] {
        return this.expanded.slice(1);
    }
}
