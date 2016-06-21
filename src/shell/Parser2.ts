import {Token, Empty} from "./Scanner";
import * as _ from "lodash";
import {Suggestion} from "../plugins/autocompletion_providers/Suggestions";

export abstract class ASTNode {
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
        return this.fullStart + this.token.raw.length;
    }

    get value(): string {
        return this.token.value;
    }

    abstract async suggestions(): Promise<Suggestion[]>;
}

abstract class BranchNode extends ASTNode {
    abstract get children(): ASTNode[];

    constructor(protected childTokens: Token[]) {
        super();
    }

    get fullStart(): number {
        return this.children[0].fullStart;
    }

    get fullEnd(): number {
        return _.last(this.children).fullEnd;
    }
}

export class CompleteCommand extends BranchNode {
    get children(): ASTNode[] {
        return this.commands;
    }

    get commands(): Command[] {
        return [new Command(this.childTokens)];
    }
}

class Command extends BranchNode {
    get children(): ASTNode[] {
        const children: ASTNode[] = [this.commandWord];
        if (this.childTokens.length > 1) {
            children.push(this.argumentList);
        }

        return children;
    }

    get commandWord(): CommandWord {
        return new CommandWord(this.childTokens[0]);
    }

    get argumentList(): ArgumentList | undefined {
        return new ArgumentList(this.childTokens.slice(1), this);
    }
}

class CommandWord extends LeafNode {
    async suggestions(): Promise<Suggestion[]> {
        return ["git", "ls"].map(word => new Suggestion().withValue(word));
    }
}

class ArgumentList extends BranchNode {
    constructor(childTokens: Token[], private command: Command) {
        super (childTokens);
    }

    get children(): ASTNode[] {
        return this.childTokens.map(token => new Argument(token, this.command));
    }
}

class Argument extends LeafNode {
    private readonly command: Command;

    constructor(token: Token, command: Command) {
        super(token);
        this.command = command;
    }

    async suggestions(): Promise<Suggestion[]> {
        if (this.command.commandWord.value === "git") {
            return ["commit", "checkout"].map(word => new Suggestion().withValue(word));
        } else if (this.command.commandWord.value === "ls") {
            return ["-l", "-h"].map(word => new Suggestion().withValue(word));
        }
    }
}

export class EmptyNode extends LeafNode {
    constructor() {
        super(new Empty());
    }

    async suggestions(): Promise<Suggestion[]> {
        return [];
    }
}

export function parse(tokens: Token[]): EmptyNode | CompleteCommand {
    if (tokens.length === 0) {
        return new EmptyNode();
    }

    return new CompleteCommand(tokens);
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
