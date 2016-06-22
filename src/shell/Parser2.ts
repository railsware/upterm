import {Token, Empty} from "./Scanner";
import * as _ from "lodash";
import {Suggestion, styles} from "../plugins/autocompletion_providers/Suggestions";
import {memoizeAccessor} from "../Decorators";
import {commandDescriptions} from "../plugins/autocompletion_providers/Executable";
import {executablesInPaths} from "../utils/Common";
import {loginShell} from "../utils/Shell";
import {SuggestionsContext} from "../Interfaces";
import {PluginManager} from "../PluginManager";

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

    get spaces(): string {
        return this.token.raw.match(/^(\s*)/)[1];
    }

    get raw(): string {
        return this.token.raw;
    }

    get value(): string {
        return this.token.value;
    }

    abstract suggestions(context: SuggestionsContext): Promise<Suggestion[]>;
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
    @memoizeAccessor
    get children(): ASTNode[] {
        return this.commands;
    }

    get commands(): Command[] {
        return [new Command(this.childTokens)];
    }
}

class Command extends BranchNode {
    @memoizeAccessor
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
    async suggestions(context: SuggestionsContext): Promise<Suggestion[]> {
        const candidates = [
            ...loginShell.preCommandModifiers.map(modifier => ({
                value: modifier,
                style: styles.func,
            })),
            ...(await executablesInPaths(context.environment.path)).map(executable => ({
                value: executable,
                style: styles.executable,
            })),
        ];

        return candidates.map(candidate => new Suggestion().withValue(`${candidate.value} `).withDescription(commandDescriptions[candidate.value] || "").withStyle(candidate.style));
    }
}

class ArgumentList extends BranchNode {
    constructor(childTokens: Token[], private command: Command) {
        super (childTokens);
    }

    @memoizeAccessor
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

    suggestions(context: SuggestionsContext): Promise<Suggestion[]> {
        return PluginManager.autocompletionProviderFor(this.command.commandWord.value)(context);
    }
}

export class EmptyNode extends LeafNode {
    constructor() {
        super(new Empty());
    }

    async suggestions(context: SuggestionsContext): Promise<Suggestion[]> {
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

function traverse(node: ASTNode, callback: (node: ASTNode) => void) {
    callback(node);

    if (node instanceof BranchNode) {
        node.children.forEach(child => traverse(child, callback));
    }
}

export function serializeReplacing(tree: ASTNode, focused: LeafNode, replacement: string) {
    let serialized = "";

    traverse(tree, current => {
        if (current instanceof LeafNode) {
            if (current === focused) {
                serialized += focused.spaces + replacement;
            } else {
                serialized += current.raw;
            }
        }
    });

    return serialized;
}
