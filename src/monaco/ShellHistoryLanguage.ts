import {services} from "../services/index";
import * as _ from "lodash";

monaco.languages.setMonarchTokensProvider("shell-history", {
    tokenizer: {
        root: [
            {
                regex: /.+/,
                action: {token: "history-item"},
            },
        ],
    },
    defaultToken: "invalid",
    tokenPostfix: ".shell-history",
});

monaco.languages.register({
    id: "shell-history",
});

monaco.languages.registerCompletionItemProvider("shell-history", {
    triggerCharacters: [" ", "/"],
    provideCompletionItems: () => {
        return {
            isIncomplete: false,
            items: _.uniqBy(services.history.all, record => record.command).map(record => ({
                label: record.command,
                kind: monaco.languages.CompletionItemKind.Text,
            })),
        };
    },
});

monaco.languages.setLanguageConfiguration("shell-history", {
    wordPattern: /.*/g,
});
