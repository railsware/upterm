var Menu = require('menu');
var MenuItem = require('menu-item');

module.exports = {
    setMenu: function (app, mainWindow) {
        if (process.platform === 'darwin') {
            var template = [
                {
                    label: 'Black Screen',
                    submenu: [
                        {
                            label: 'About Black Screen',
                            selector: 'orderFrontStandardAboutPanel:'
                        },
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Services',
                            submenu: []
                        },
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Hide Black Screen',
                            accelerator: 'Command+H',
                            selector: 'hide:'
                        },
                        {
                            label: 'Hide Others',
                            accelerator: 'Command+Shift+H',
                            selector: 'hideOtherApplications:'
                        },
                        {
                            label: 'Show All',
                            selector: 'unhideAllApplications:'
                        },
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Quit',
                            accelerator: 'Command+Q',
                            click: function () {
                                app.quit();
                            }
                        }
                    ]
                },
                {
                    label: 'Edit',
                    submenu: [
                        {
                            label: 'Undo',
                            accelerator: 'Command+Z',
                            selector: 'undo:'
                        },
                        {
                            label: 'Redo',
                            accelerator: 'Shift+Command+Z',
                            selector: 'redo:'
                        },
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Cut',
                            accelerator: 'Command+X',
                            selector: 'cut:'
                        },
                        {
                            label: 'Copy',
                            accelerator: 'Command+C',
                            selector: 'copy:'
                        },
                        {
                            label: 'Paste',
                            accelerator: 'Command+V',
                            selector: 'paste:'
                        },
                        {
                            label: 'Select All',
                            accelerator: 'Command+A',
                            selector: 'selectAll:'
                        }
                    ]
                },
                {
                    label: 'View',
                    submenu: [
                        {
                            label: 'Reload',
                            accelerator: 'Command+R',
                            click: function () {
                                mainWindow.restart();
                            }
                        },
                        {
                            label: 'Toggle Full Screen',
                            accelerator: 'Ctrl+Command+F',
                            click: function () {
                                mainWindow.setFullScreen(!mainWindow.isFullScreen());
                            }
                        },
                        {
                            label: 'Toggle Developer Tools',
                            accelerator: 'Alt+Command+I',
                            click: function () {
                                mainWindow.toggleDevTools();
                            }
                        }
                    ]
                },
                {
                    label: 'Window',
                    submenu: [
                        {
                            label: 'Minimize',
                            accelerator: 'Command+M',
                            selector: 'performMiniaturize:'
                        },
                        {
                            label: 'Close',
                            accelerator: 'Command+W',
                            selector: 'performClose:'
                        },
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Bring All to Front',
                            selector: 'arrangeInFront:'
                        }
                    ]
                },
                {
                    label: 'Help',
                    submenu: [
                        {
                            label: 'GitHub Repository',
                            click: function () {
                                require('shell').openExternal('https://github.com/shockone/black-screen')
                            }
                        }
                    ]
                }
            ];

            menu = Menu.buildFromTemplate(template);
            Menu.setApplicationMenu(menu);
        } else {
            template = [
                {
                    label: '&File',
                    submenu: [
                        {
                            label: '&Open',
                            accelerator: 'Ctrl+O'
                        },
                        {
                            label: '&Close',
                            accelerator: 'Ctrl+W',
                            click: function () {
                                mainWindow.close();
                            }
                        }
                    ]
                },
                {
                    label: '&View',
                    submenu: [
                        {
                            label: '&Reload',
                            accelerator: 'Ctrl+R',
                            click: function () {
                                mainWindow.restart();
                            }
                        },
                        {
                            label: 'Toggle &Full Screen',
                            accelerator: 'F11',
                            click: function () {
                                mainWindow.setFullScreen(!mainWindow.isFullScreen());
                            }
                        },
                        {
                            label: 'Toggle &Developer Tools',
                            accelerator: 'Alt+Ctrl+I',
                            click: function () {
                                mainWindow.toggleDevTools();
                            }
                        }
                    ]
                },
                {
                    label: 'Help',
                    submenu: [
                        {
                            label: 'GitHub Repository',
                            click: function () {
                                require('shell').openExternal('https://github.com/shockone/black-screen')
                            }
                        }
                    ]
                }
            ];

            menu = Menu.buildFromTemplate(template);
            mainWindow.setMenu(menu);
        }
    }
};
