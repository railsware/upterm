const menuConstructor: typeof Electron.Menu = require("menu");

export default {
    setMenu: (app: Electron.App, browserWindow: Electron.BrowserWindow) => {
        if (process.platform === "darwin") {
            const template: Electron.MenuItemOptions[] = [
                {
                    label: "Black Screen",
                    submenu: [
                        {
                            label: "About Black Screen",
                            role: "about",
                        },
                        {
                            label: "Quit",
                            accelerator: "Command+Q",
                            click: function () {
                                app.quit();
                            },
                        },
                    ],
                },
                {
                    label: "Edit",
                    submenu: [
                        {
                            label: "Undo",
                            accelerator: "Command+Z",
                            role: "undo",
                        },
                        {
                            label: "Redo",
                            accelerator: "Shift+Command+Z",
                            role: "redo",
                        },
                        {
                            type: "separator",
                        },
                        {
                            label: "Cut",
                            accelerator: "Command+X",
                            role: "cut",
                        },
                        {
                            label: "Copy",
                            accelerator: "Command+C",
                            role: "copy",
                        },
                        {
                            label: "Paste",
                            accelerator: "Command+V",
                            role: "paste",
                        },
                        {
                            label: "Select All",
                            accelerator: "Command+A",
                            role: "selectall",
                        },
                    ],
                },
                {
                    label: "View",
                    submenu: [
                        {
                            label: "Reload",
                            accelerator: "Command+R",
                            click: function () {
                                browserWindow.reload();
                            },
                        },
                        {
                            label: "Toggle Full Screen",
                            accelerator: "Ctrl+Command+F",
                            click: function () {
                                browserWindow.setFullScreen(!browserWindow.isFullScreen());
                            },
                        },
                        {
                            label: "Toggle Developer Tools",
                            accelerator: "Alt+Command+I",
                            click: function () {
                                browserWindow.webContents.toggleDevTools();
                            },
                        },
                    ],
                },
                {
                    label: "Help",
                    submenu: [
                        {
                            label: "GitHub Repository",
                            click: function () {
                                /* tslint:disable:no-unused-expression */
                                require("shell").openExternal("https://github.com/shockone/black-screen");
                            },
                        },
                    ],
                },
            ];

            let menu = menuConstructor.buildFromTemplate(template);
            menuConstructor.setApplicationMenu(menu);
        } else {
            const template = [
                {
                    label: "&View",
                    submenu: [
                        {
                            label: "&Reload",
                            accelerator: "Ctrl+R",
                            click: function () {
                                browserWindow.reload();
                            },
                        },
                        {
                            label: "Toggle &Full Screen",
                            accelerator: "F11",
                            click: function () {
                                browserWindow.setFullScreen(!browserWindow.isFullScreen());
                            },
                        },
                        {
                            label: "Toggle &Developer Tools",
                            accelerator: "Alt+Ctrl+I",
                            click: function () {
                                browserWindow.webContents.toggleDevTools();
                            },
                        },
                    ],
                },
                {
                    label: "Help",
                    submenu: [
                        {
                            label: "GitHub Repository",
                            click: function () {
                                require("shell").openExternal("https://github.com/shockone/black-screen");
                            },
                        },
                    ],
                },
            ];

            let menu = menuConstructor.buildFromTemplate(template);
            browserWindow.setMenu(menu);
        }
    },
};
