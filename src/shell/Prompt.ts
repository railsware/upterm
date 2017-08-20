import * as events from "events";
import {scan, Token, expandAliases} from "./Scanner";
import {CompleteCommand} from "./Parser";
import {Session} from "./Session";

export class Prompt extends events.EventEmitter {
    private _value = "";
    private _expandedAst: CompleteCommand;

    constructor(private session: Session) {
        super();
    }

    get value(): string {
        return this._value;
    }

    setValue(value: string): void {
        this._value = value;

        const tokens = scan(this.value);
        this._expandedAst = new CompleteCommand(expandAliases(tokens, this.session.aliases));
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
