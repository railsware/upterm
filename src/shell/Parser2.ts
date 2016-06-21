import {Token} from "./Scanner";
import * as _ from "lodash";
import {Suggestion} from "../plugins/autocompletion_providers/Suggestions";

abstract class ASTNode {
    abstract get fullStart(): number;
    abstract get fullEnd(): number;
}

abstract class LeafNode extends ASTNode {
    constructor(private token: Token) {
        super();
    }

    get fullStart(): number {
        return this.token.fullStart;
    }

    get fullEnd(): number {
        return this.fullStart + this.token.raw.length - 1;
    }

    get value(): string {
        return this.token.value;
    }

    abstract get suggestions(): Suggestion[];
}

abstract class BranchNode extends ASTNode {
    readonly children: ASTNode[];

    constructor(children: ASTNode[]) {
        super();

        this.children = children;
    }

    get fullStart(): number {
        return this.children[0].fullStart;
    }

    get fullEnd(): number {
        return _.last(this.children).fullEnd;
    }
}

class CompleteCommand extends BranchNode {
}

class Command extends BranchNode {
    readonly commandWord: CommandWord;
    readonly argumentList: ArgumentList;

    constructor(tokens: Token[]) {
        const commandWord = new CommandWord(tokens[0]);

        const argumentList = tokens.length === 1 ? new EmptyArgumentList(() => this) : new ArgumentList(tokens.slice(1).map(token => new Argument(token, this)));

        super([commandWord, argumentList]);

        this.commandWord = commandWord;
        this.argumentList = argumentList;
    }
}

class CommandWord extends LeafNode {
    get suggestions(): Suggestion[] {
        return ["git", "ls"].map(word => new Suggestion().withValue(word));
    }
}

class ArgumentList extends BranchNode {
}

class Argument extends LeafNode {
    private readonly command: Command;

    constructor(token: Token, command: Command) {
        super(token);
        this.command = command;
    }

    get suggestions(): Suggestion[] {
        if (this.command.commandWord.value === "git") {
            return ["commit", "checkout"].map(word => new Suggestion().withValue(word));
        } else if (this.command.commandWord.value === "ls") {
            return ["-l", "-h"].map(word => new Suggestion().withValue(word));
        }
    }
}

export function parse(tokens: Token[]): CompleteCommand {
    return new CompleteCommand([
        new Command(tokens),
    ]);
}

export function leafNodeAt(position: number, node: ASTNode): LeafNode {
    if (node instanceof LeafNode) {
        return node;
    } else if (node instanceof BranchNode) {
        return leafNodeAt(position, node.children.find(child => child.fullStart <= position && child.fullEnd >= position));
    } else {
        throw "Should never happen";
    }
}
