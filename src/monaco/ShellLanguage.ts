import {SessionID} from "../shell/Session";
import {getSuggestions} from "../Autocompletion";
import {services} from "../services/index";
import {scan} from "../shell/Scanner";
import {CompleteCommand} from "../shell/Parser";
import CompletionItemKind = monaco.languages.CompletionItemKind;
import {io} from "../utils/Common";

monaco.languages.setMonarchTokensProvider("shell", {
    tokenizer: {
        root: [
            {
                regex: /^\w+/,
                action: {token: "executable"},
            },
            {
                regex: /--?[\w=]+/,
                action: {token: "option-name"},
            },
            {
                regex: / \w+/,
                action: {token: "argument"},
            },
        ],
    },
    tokenPostfix: ".shell",
});

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
});

monaco.editor.onDidCreateModel(model => {
    model.onDidChangeContent(async () => {
        monaco.editor.setModelMarkers(model, "upterm", []);

        const value = model.getValue();
        if (value.length === 0) {
            return;
        }
        const tokens = scan(value);
        if (tokens.length < 2) {
            return;
        }
        const commandName = tokens[0].value;

        const uri = model.uri.toString();
        const sessionID: SessionID = <SessionID>Number.parseInt(uri.match(/inmemory:\/\/(\d+)\.sh/)![1]);
        const session = services.sessions.get(sessionID);

        const executables = await io.executablesInPaths(session.environment.path);

        if (!executables.includes(commandName)) {
            monaco.editor.setModelMarkers(model, "upterm", [{
                severity: monaco.Severity.Error,
                message: `Executable ${commandName} doesn't exist in $PATH.`,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: commandName.length + 1,
            }]);
        }
    });
});

monaco.languages.registerCompletionItemProvider("shell", {
    triggerCharacters: [" ", "/"],
    provideCompletionItems: async function (model, position): Promise<monaco.languages.CompletionList> {
        model.getValue();
        const uri = model.uri.toString();
        const sessionID: SessionID = <SessionID>Number.parseInt(uri.match(/inmemory:\/\/(\d+)\.sh/)![1]);
        const session = services.sessions.get(sessionID);
        const text = model.getValue();

        const ast = new CompleteCommand(scan(text));

        const suggestions = await getSuggestions({
            currentText: text,
            currentCaretPosition: position.column - 1,
            ast: ast,
            environment: session.environment,
            historicalPresentDirectoriesStack: session.historicalPresentDirectoriesStack,
            aliases: session.aliases,
        });

        return {
            isIncomplete: false,
            items: suggestions.map(suggestion => ({
                label: suggestion.value,
                kind: CompletionItemKind.Field,
                detail: suggestion.description,
            })),
        };
    },
});
