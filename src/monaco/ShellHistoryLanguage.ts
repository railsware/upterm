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
            items: _.uniq(services.history.all.map(record => record.command)).reverse().map(command => ({
                label: command,
                kind: monaco.languages.CompletionItemKind.Value,
            })),
        };
    },
});
