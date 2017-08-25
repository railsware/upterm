import {SessionID} from "../shell/Session";
import {getSuggestions} from "../Autocompletion";
import {services} from "../services/index";
import {scan} from "../shell/Scanner";
import {CompleteCommand} from "../shell/Parser";
import {io} from "../utils/Common";

monaco.languages.setMonarchTokensProvider("shell", {
    variableName: /[a-zA-Z][a-zA-Z0-9_]*/,
    word: /[a-zA-Z0-9\u0080-\uFFFF+~!@#%^*_,.:/?\\-]+/,
    escapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,
    defaultToken: "invalid",
    tokenizer: {
        root: [
            {
                regex: /\s+/,
                action: {token: "spaces"},
            },
            {
                regex: /@variableName=/,
                action: {token: "variable-name", next: "@variableValue"},
            },
            {
                regex: /@word/,
                action: {token: "command-name", next: "@command"},
            },
        ],
        command: [
            [/\s+/, "spaces"],
            [/@word/, "argument"],
            {
                regex: /\|\|/,
                action: {token: "or", next: "@pop"},
            },
            {
                regex: /\|/,
                action: {token: "pipe", next: "@pop"},
            },
            {
                regex: /;/,
                action: {token: "semicolon", next: "@pop"},
            },
            {
                regex: /&&/,
                action: {token: "and", next: "@pop"},
            },
            {
                regex: />>/,
                action: {token: "appending-output-redirection-symbol", next: "@redirect"},
            },
            {
                regex: /</,
                action: {token: "input-redirection-symbol", next: "@redirect"},
            },
            {
                regex: />/,
                action: {token: "output-redirection-symbol", next: "@redirect"},
            },
            { include: "@allowStringLiterals" },
        ],
        redirect: [
            {
                regex: /\s+/,
                action: {token: "spaces"},
            },
            {
                regex: /@word/,
                action: {token: "redirect-path", next: "@pop"},
            },
        ],
        variableValue: [
            {
                regex: /@word/,
                action: {token: "variable-value", next: "@pop"},
            },
            {include: "@checkInvalidStringLiteral"},
            {
                regex: /"/,
                action: {token: "string", switchTo: "@doubleQuotedString"},
            },
            {
                regex: /'/,
                action: {token: "string", switchTo: "@singleQuotedString"},
            },
            {
                regex: /.*/,
                action: {token: "invalid"},
            },
        ],
        checkInvalidStringLiteral: [
            // strings: recover on non-terminated strings
            [/"([^"\\]|\\.)*$/, "string.invalid"],  // non-teminated string
            [/'([^'\\]|\\.)*$/, "string.invalid"],  // non-teminated string
        ],
        allowStringLiterals: [
            {include: "@checkInvalidStringLiteral"},
            [/"/, "string", "@doubleQuotedString"],
            [/'/, "string", "@singleQuotedString"],
        ],
        singleQuotedString: [
            [/[^\\']+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./,      "string.escape.invalid"],
            [/'/, "string", "@pop"],
        ],
        doubleQuotedString: [
            [/\$@variableName/, "variable-name"],
            [/\${@variableName}/, "variable-name"],
            [/[^\\"$]+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./,      "string.escape.invalid"],
            [/"/, "string", "@pop"],
        ],

    },
    tokenPostfix: ".shell",
} as any);

monaco.languages.register({
    id: "shell",
});

monaco.languages.setLanguageConfiguration("shell", {
    brackets: [
        ["'", "'"],
        ['"', '"'],
        ["`", "`"],
        ["(", ")"],
        ["[", "]"],
        ["{", "}"],
    ],
    wordPattern: /(\d*\.\d\w*\$)|([^\`\~\!\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\<\>\/\?\s]+)/g,
});

monaco.editor.onDidCreateModel(model => {
    if (model.uri.scheme !== "shell") {
        return;
    }

    model.onDidChangeContent(async () => {
        monaco.editor.setModelMarkers(model, "upterm", []);

        const value = model.getValue();

        if (value.length === 0) {
            return;
        }

        const sessionID: SessionID = <SessionID>Number.parseInt(model.uri.authority);
        const session = services.sessions.get(sessionID);
        const executables = await io.executablesInPaths(session.environment.path);

        monaco.editor.tokenize(value, "shell").forEach((lineTokens, lineIndex) => {
            lineTokens.forEach((token, tokenIndex) => {
                if (token.type !== "command-name.shell") {
                    return;
                }

                const nextToken = lineTokens[tokenIndex + 1];

                // Possibly still writing command name.
                if (!nextToken) {
                    return;
                }

                const tokenRange = {
                    startLineNumber: lineIndex + 1,
                    endLineNumber: lineIndex + 1,
                    startColumn: token.offset + 1,
                    endColumn: nextToken ? (nextToken.offset + 1) : Infinity,
                };
                const commandName = model.getValueInRange(tokenRange);

                if (!executables.includes(commandName) && !session.aliases.has(commandName)) {
                    monaco.editor.setModelMarkers(model, "upterm", [{
                        severity: monaco.Severity.Error,
                        message: `Executable ${commandName} doesn't exist in $PATH.`,
                        ...tokenRange,
                    }]);
                }
            });
        });
    });
});

monaco.languages.registerCompletionItemProvider("shell", {
    triggerCharacters: [" ", "/", "$", "-", "."],
    provideCompletionItems: async function (model, position): Promise<monaco.languages.CompletionList> {
        model.getValue();
        const sessionID: SessionID = <SessionID>Number.parseInt(model.uri.authority);
        const session = services.sessions.get(sessionID);
        const text = model.getValue();

        const ast = new CompleteCommand(scan(text));

        return getSuggestions({
            currentText: text,
            currentCaretPosition: position.column - 1,
            ast: ast,
            environment: session.environment,
            historicalPresentDirectoriesStack: session.historicalPresentDirectoriesStack,
            aliases: session.aliases,
        });
    },
});

// https://github.com/Microsoft/monaco-editor/issues/346#issuecomment-277215371
export function getTokensAtLine(model: any, lineNumber: number) {
    // Force line's state to be accurate
    model.getLineTokens(lineNumber, /*inaccurateTokensAcceptable*/false);
    // Get the tokenization state at the beginning of this line
    const freshState = model._lines[lineNumber - 1].getState().clone();
    // Get the human readable tokens on this line
    return model._tokenizationSupport.tokenize(model.getLineContent(lineNumber), freshState, 0).tokens;
}
