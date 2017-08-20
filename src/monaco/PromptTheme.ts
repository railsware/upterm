import {backgroundColor, colors, textColor} from "../views/css/colors";

monaco.editor.defineTheme("upterm-prompt-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
        {token: "string", foreground: colors.green.slice(1)},
        {token: "string.invalid", foreground: colors.red.slice(1)},
        {token: "executable", foreground: colors.blue.slice(1), fontStyle: "bold"},
        {token: "option-name", foreground: colors.yellow.slice(1)},
        {token: "argument", foreground: textColor.slice(1)},
    ],
    colors: {
        "editor.foreground": textColor,
        "editor.background": backgroundColor,
        "editor.lineHighlightBackground": backgroundColor,
    },
});
