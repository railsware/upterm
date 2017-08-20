import {backgroundColor, colors, textColor} from "../views/css/colors";

monaco.editor.defineTheme("upterm-prompt-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
        {token: "string", foreground: colors.green.slice(1)},
        {token: "string.invalid", foreground: colors.red.slice(1)},
        {token: "word", foreground: textColor.slice(1)},
        {token: "pipe", foreground: colors.yellow.slice(1)},
        {token: "semicolon", foreground: colors.yellow.slice(1)},
        {token: "and", foreground: colors.yellow.slice(1)},
        {token: "or", foreground: colors.yellow.slice(1)},
        {token: "appending-output-redirection-symbol", foreground: colors.yellow.slice(1)},
        {token: "input-redirection-symbol", foreground: colors.yellow.slice(1)},
        {token: "output-redirection-symbol", foreground: colors.yellow.slice(1)},
    ],
    colors: {
        "editor.foreground": textColor,
        "editor.background": backgroundColor,
        "editor.lineHighlightBackground": backgroundColor,
    },
});
