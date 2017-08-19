monaco.editor.defineTheme("upterm-prompt-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
        {token: "executable", foreground: "1ea81e"},
        {token: "option-name", foreground: "7492ff", fontStyle: "bold"},
        {token: "argument", foreground: "ebf9f9"},
    ],
    colors: {
        "editor.foreground": "#EEE",
        "editor.background": "#292929",
        "editor.lineHighlightBackground": "#292929",
    },
});
