import * as Scanner from "./Scanner";
import * as _ from "lodash";
import {memoizeAccessor} from "../Decorators";
import {commandDescriptions} from "../plugins/autocompletion_providers/Executable";
import {io, mapObject} from "../utils/Common";
import {loginShell} from "../utils/Shell";
import {PreliminaryAutocompletionContext} from "../Interfaces";
import {PluginManager} from "../PluginManager";
import {Aliases} from "./Aliases";
import {combine} from "../plugins/autocompletion_utils/Combine";
import {
    styles,
    anyFilesSuggestions,
    environmentVariableSuggestions,
    executableFilesSuggestions, Suggestion,
} from "../plugins/autocompletion_utils/Common";


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

    get precedingSpaces(): string {
        const match = this.token.raw.match(/^(\s*)/);
        if (match) {
            return match[1];
        } else {
            return "";
        }
    }

    get followingSpaces(): string {
        // Consists only of spaces. They're considered preceding.
        if (this.token.raw.match(/^(\s*)$/)) {
            return "";
        }

        const match = this.token.raw.match(/(\s*)$/);
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
    readonly tokens: Scanner.Token[];
    abstract get children(): ASTNode[];

    constructor(tokens: Scanner.Token[]) {
        super();
        this.tokens = tokens;
    }

    get fullStart(): number {
        return this.children[0].fullStart;
    }

    get fullEnd(): number {
        return _.last(this.children)!.fullEnd;
    }
}

export class CompleteCommand extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        const lastChild = _.last(this.tokens)!;
        const endsWithSeparator = lastChild instanceof Scanner.Semicolon;

        if (endsWithSeparator) {
            return [
                new List(this.tokens.slice(0, -1)),
                new ShellSyntaxNode(lastChild),
            ];
        } else {
            return [
                new List(this.tokens),
            ];
        }
    }

    get firstCommand(): Command {
        for (const current of traverse(this)) {
            if (current instanceof Command) {
                return current;
            }
        }
        return undefined as any as Command;
    }
}

class List extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        const separatorOpIndex = _.findLastIndex(this.tokens, token => token instanceof Scanner.Semicolon);

        if (separatorOpIndex !== -1) {
            return [
                new List(this.tokens.slice(0, separatorOpIndex)),
                new ShellSyntaxNode(this.tokens[separatorOpIndex]),
                new AndOr(this.tokens.slice(separatorOpIndex + 1)),
            ];
        } else {
            return [
                new AndOr(this.tokens),
            ];
        }
    }
}

class AndOr extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        const andOrTokenIndex = _.findLastIndex(this.tokens, token => token instanceof Scanner.And || token instanceof Scanner.Or);

        if (andOrTokenIndex !== -1) {
            return [
                new AndOr(this.tokens.slice(0, andOrTokenIndex)),
                new ShellSyntaxNode(this.tokens[andOrTokenIndex]),
                new Pipeline(this.tokens.slice(andOrTokenIndex + 1)),
            ];
        } else {
            return [
                new Pipeline(this.tokens),
            ];
        }
    }
}

class Pipeline extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        return [new PipeSequence(this.tokens)];
    }
}

class PipeSequence extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        const pipeIndex = _.findLastIndex(this.tokens, token => token instanceof Scanner.Pipe);

        if (pipeIndex !== -1) {
            return [
                new PipeSequence(this.tokens.slice(0, pipeIndex)),
                new ShellSyntaxNode(this.tokens[pipeIndex]),
                new Command(this.tokens.slice(pipeIndex + 1)),
            ];
        } else {
            return [
                new Command(this.tokens),
            ];
        }
    }
}

class Command extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        if (!this.tokens.length) {
            return [new EmptyNode()];
        }

        const children: ASTNode[] = [];

        if (this.parameterAssignments) {
            children.push(this.parameterAssignments);
        }

        if (this.commandWord) {
            children.push(this.commandWord);
        }

        if (this.argumentList) {
            children.push(this.argumentList);
        }

        if (this.ioRedirect) {
            children.push(this.ioRedirect);
        }

        return children;
    }

    @memoizeAccessor
    get commandWord(): CommandWord | undefined {
        if (this.categorizedTokens.commandWord) {
            return new CommandWord(this.categorizedTokens.commandWord);
        }
    }

    @memoizeAccessor
    get parameterAssignments(): ParameterAssignmentList | undefined {
        if (this.categorizedTokens.parameterAssignment.length) {
            return new ParameterAssignmentList(this.categorizedTokens.parameterAssignment);
        }
    }

    @memoizeAccessor
    get argumentList(): ArgumentList | undefined {
        if (this.categorizedTokens.argumentList.length) {
            return new ArgumentList(this.categorizedTokens.argumentList, this);
        }
    }

    nthArgument(position: OneBasedPosition): Argument | undefined {
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
        if (this.categorizedTokens.ioRedirect.length) {
            return new IORedirect(this.categorizedTokens.ioRedirect);
        }
    }

    @memoizeAccessor
    private get categorizedTokens() {
        /**
         * @link http://stackoverflow.com/a/10939280/1149074
         */
        const parameterAssignmentTokens = _.takeWhile(this.tokens, token => token.value.includes("="));

        const commandWordToken = this.tokens[parameterAssignmentTokens.length];

        const beforeArgumentListTokensCount = parameterAssignmentTokens.length + 1;
        const argumentListTokens = _.takeWhile(this.tokens.slice(beforeArgumentListTokensCount), token => !(
            token instanceof Scanner.InputRedirectionSymbol ||
            token instanceof Scanner.OutputRedirectionSymbol ||
            token instanceof Scanner.AppendingOutputRedirectionSymbol
        ));

        const ioRedirectTokens = this.tokens.slice(beforeArgumentListTokensCount + argumentListTokens.length);

        return {
            parameterAssignment: parameterAssignmentTokens,
            commandWord: commandWordToken,
            argumentList: argumentListTokens,
            ioRedirect: ioRedirectTokens,
        };
    }
}

class IORedirect extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        if (this.tokens.length === 1) {
            return [
                new ShellSyntaxNode(this.tokens[0]),
                new EmptyNode(),
            ];
        } else {
            return [
                new ShellSyntaxNode(this.tokens[0]),
                new IOFile(this.tokens[1]),
                ...this.tokens.slice(2).map(token => new UnknownNode(token)),
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
    async suggestions(_context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        return [];
    }
}

class ParameterAssignmentList extends BranchNode {
    @memoizeAccessor
    get children(): ASTNode[] {
        return this.tokens.map(token => new ParameterAssignment(token));
    }
}

export class ParameterAssignment extends LeafNode {
    async suggestions(_context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        return [];
    }
}

export class CommandWord extends LeafNode {
    async suggestions({
        environment,
        aliases,
    }: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
        if (this.value.length === 0) {
            return [];
        }

        const relativeExecutablesSuggestions = await executableFilesSuggestions(this.value, environment.pwd);
        const executables = await io.executablesInPaths(environment.path);

        return [
            ...mapObject(aliases.toObject(), (key, value) => ({value: key, description: value, style: styles.alias, space: true})),
            ...loginShell.preCommandModifiers.map(modifier => ({value: modifier, style: styles.func, space: true})),
            ...executables.map(name => ({value: name, description: commandDescriptions[name] || "", style: styles.executable, space: true})),
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
        return this.tokens.map((token, index) => new Argument(token, this.command, index + 1));
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
            PluginManager.autocompletionProviderFor(argument.command.commandWord!.value),
        ]);

        return provider({...context, argument: argument});
    }
}

// FIXME: find a better way to search for the argument in the new tree.
function argumentOfExpandedAST(argument: Argument, aliases: Aliases) {
    const commandWord = argument.command.commandWord!;

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
    async suggestions(_context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
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

    async suggestions(_context: PreliminaryAutocompletionContext): Promise<Suggestion[]> {
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
                serialized += focused.precedingSpaces + replacement + focused.followingSpaces;
            } else {
                serialized += current.raw;
            }
        }
    }

    return serialized;
}
