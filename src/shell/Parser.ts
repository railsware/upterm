import * as Scanner from "./Scanner";
import * as _ from "lodash";
import {Suggestion, styles, anyFilesSuggestions} from "../plugins/autocompletion_providers/Common";
import {memoizeAccessor} from "../Decorators";
import {commandDescriptions} from "../plugins/autocompletion_providers/Executable";
import {executablesInPaths, mapObject} from "../utils/Common";
import {loginShell} from "../utils/Shell";
import {PreliminaryAutocompletionContext} from "../Interfaces";
import {PluginManager} from "../PluginManager";
import {Aliases} from "./Aliases";
import {
    environmentVariableSuggestions,
    combine,
    executableFilesSuggestions,
} from "../plugins/autocompletion_providers/Common";

export abstract class ASTNode {
    abstract get fullStart(): number;

    abstract get fullEnd(): number;
}

abstract class LeafNode extends ASTNode {
    constructor(private token: Scanner.Token) {
        super();
    }

    get fullStart(): number {
        return this.token.fullStart;
    }

    get fullEnd(): number {
        return this.fullStart + this.token.raw.length;
    }

    get spaces(): string {
        const match = this.token.raw.match(/^(\s*)/);
        if (match) {
            return match[1];
        } else {
            return "";
        }
    }

    get raw(): string {
        return this.token.raw;
    }

    get value(): string {
        return this.token.value;
    }

    abstract suggestions(context: PreliminaryAutocompletionContext): Promise<Suggestion[]>;
}

abstract class BranchNode extends ASTNode {
    abstract get children(): ASTNode[];

    constructor(protected childTokens: Scanner.Token[]) {
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
        const lastChild = _.last(this.childTokens);
        const endsWithSeparator = lastChild instanceof Scanner.Semicolon;

        if (endsWithSeparator) {
            return [
                new List(this.childTokens.slice(0, -1)),
                new ShellSyntaxNode(lastChild),
            ];
        } else {
            return [
                new List(this.childTokens),
            ];
        }
    }
}

class List extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        const separatorOpIndex = _.findLastIndex(this.childTokens, token => token instanceof Scanner.Semicolon);

        if (separatorOpIndex !== -1) {
            return [
                new List(this.childTokens.slice(0, separatorOpIndex)),
                new ShellSyntaxNode(this.childTokens[separatorOpIndex]),
                new AndOr(this.childTokens.slice(separatorOpIndex + 1)),
            ];
        } else {
            return [
                new AndOr(this.childTokens),
            ];
        }
    }
}

class AndOr extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        const andOrTokenIndex = _.findLastIndex(this.childTokens, token => token instanceof Scanner.And || token instanceof Scanner.Or);

        if (andOrTokenIndex !== -1) {
            return [
                new AndOr(this.childTokens.slice(0, andOrTokenIndex)),
                new ShellSyntaxNode(this.childTokens[andOrTokenIndex]),
                new Pipeline(this.childTokens.slice(andOrTokenIndex + 1)),
            ];
        } else {
            return [
                new Pipeline(this.childTokens),
            ];
        }
    }
}

class Pipeline extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        return [new PipeSequence(this.childTokens)];
    }
}

class PipeSequence extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        const pipeIndex = _.findLastIndex(this.childTokens, token => token instanceof Scanner.Pipe);

        if (pipeIndex !== -1) {
            return [
                new PipeSequence(this.childTokens.slice(0, pipeIndex)),
                new ShellSyntaxNode(this.childTokens[pipeIndex]),
                new Command(this.childTokens.slice(pipeIndex + 1)),
            ];
        } else {
            return [
                new Command(this.childTokens),
            ];
        }
    }
}

class Command extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        if (this.childTokens.length) {
            const children: ASTNode[] = [this.commandWord];

            if (this.argumentList) {
                children.push(this.argumentList);
            }

            if (this.ioRedirect) {
                children.push(this.ioRedirect);
            }

            return children;
        } else {
            return [new EmptyNode()];
        }
    }

    @memoizeAccessor
    get commandWord(): CommandWord {
        return new CommandWord(this.childTokens[0]);
    }

    @memoizeAccessor
    get argumentList(): ArgumentList | undefined {
        if (this.argumentListTokens.length) {
            return new ArgumentList(this.argumentListTokens, this);
        }
    }

    nthArgument(position: OneBasedIndex): Argument | undefined {
        if (this.argumentList) {
            return this.argumentList.arguments[position - 1];
        }
    }

    hasArgument(value: string, currentArgument: Argument): boolean {
        if (this.argumentList) {
            return this.argumentList.arguments.filter(argument => argument !== currentArgument).map(argument => argument.value).includes(value);
        } else {
            return false;
        }
    }

    @memoizeAccessor
    private get ioRedirect(): IORedirect | undefined {
        if (this.ioRedirectTokenIndex !== -1) {
            return new IORedirect(this.childTokens.slice(this.ioRedirectTokenIndex));
        }
    }

    @memoizeAccessor
    private get ioRedirectTokenIndex(): number {
        return this.childTokens.findIndex(token => {
            return (
                token instanceof Scanner.InputRedirectionSymbol ||
                token instanceof Scanner.OutputRedirectionSymbol ||
                token instanceof Scanner.AppendingOutputRedirectionSymbol
            );
        });
    }

    @memoizeAccessor
    private get argumentListTokens(): Scanner.Token[] {
        if (this.ioRedirect) {
            return this.childTokens.slice(1, this.ioRedirectTokenIndex);
        } else {
            return this.childTokens.slice(1);
        }
    }
}

class IORedirect extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        if (this.childTokens.length === 1) {
            return [
                new ShellSyntaxNode(this.childTokens[0]),
                new EmptyNode(),
            ];
        } else {
            return [
                new ShellSyntaxNode(this.childTokens[0]),
                new IOFile(this.childTokens[1]),
                ...this.childTokens.slice(2).map(token => new UnknownNode(token)),
            ];
        }
    }
}

class IOFile extends LeafNode {
    suggestions(context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        return anyFilesSuggestions(this.value, context.environment.pwd);
    }
}

class ShellSyntaxNode extends LeafNode {
    async suggestions(context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        return [];
    }
}

class CommandWord extends LeafNode {
    async suggestions(context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        if (this.value.length === 0) {
            return [];
        }

        const relativeExecutablesSuggestions = await executableFilesSuggestions(this.value, context.environment.pwd);
        const executables = await executablesInPaths(context.environment.path);

        return [
            ...mapObject(context.aliases.toObject(), (key, value) => new Suggestion({value: key, description: value, style: styles.alias, space: true})),
            ...loginShell.preCommandModifiers.map(modifier => new Suggestion({value: modifier, style: styles.func, space: true})),
            ...executables.map(name => new Suggestion({value: name, description: commandDescriptions[name] || "", style: styles.executable, space: true})),
            ...relativeExecutablesSuggestions,
        ];
    }
}

class ArgumentList extends BranchNode {
    constructor(childTokens: Scanner.Token[], private command: Command) {
        super(childTokens);
    }

    @memoizeAccessor
    get children(): ASTNode[] {
        return this.arguments;
    }

    @memoizeAccessor
    get arguments(): Argument[] {
        return this.childTokens.map((token, index) => new Argument(token, this.command, index + 1));
    }
}

export class Argument extends LeafNode {
    readonly position: number;
    readonly command: Command;

    constructor(token: Scanner.Token, command: Command, position: number) {
        super(token);
        this.command = command;
        this.position = position;
    }

    async suggestions(context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        const argument = argumentOfExpandedAST(this, context.aliases);
        const provider = combine([
            environmentVariableSuggestions,
            PluginManager.autocompletionProviderFor(argument.command.commandWord.value),
        ]);

        return provider(Object.assign(context, {argument: argument}));
    }
}

// FIXME: find a better way to search for the argument in the new tree.
function argumentOfExpandedAST(argument: Argument, aliases: Aliases) {
    const commandWord = argument.command.commandWord;

    if (aliases.has(commandWord.value)) {
        const tree = new CompleteCommand(Scanner.scan(serializeReplacing(argument.command, commandWord, aliases.get(commandWord.value))));

        for (const current of traverse(tree)) {
            if (current instanceof Argument && current.value === argument.value) {
                return current;
            }
        }

        throw "Couldn't find the argument.";
    } else {
        return argument;
    }
}

export class UnknownNode extends LeafNode {
    async suggestions(context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        return [];
    }
}

export class EmptyNode extends LeafNode {
    constructor() {
        super(new Scanner.Empty());
    }

    // FIXME: a workaround for leafNodeAt to parse, say, `ls |` correctly.
    get fullEnd() {
        return Number.MAX_SAFE_INTEGER;
    }

    async suggestions(context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        return [];
    }
}

export function leafNodeAt(position: number, node: ASTNode): LeafNode {
    if (node instanceof LeafNode) {
        return node;
    } else if (node instanceof BranchNode) {
        const childAt = node.children.find(child => child.fullStart <= position && child.fullEnd >= position);

        if (childAt) {
            return leafNodeAt(position, childAt);
        } else {
            throw `Couldn't find a child at position ${position}`;
        }
    } else {
        throw "Should never happen";
    }
}

function *traverse(node: ASTNode): Iterable<ASTNode> {
    yield node;

    if (node instanceof BranchNode) {
        for (const child of node.children) {
            yield * traverse(child);
        }
    }
}

export function serializeReplacing(tree: ASTNode, focused: LeafNode, replacement: string) {
    let serialized = "";

    for (const current of traverse(tree)) {
        if (current instanceof LeafNode) {
            if (current === focused) {
                serialized += focused.spaces + replacement;
            } else {
                serialized += current.raw;
            }
        }
    }

    return serialized;
}
