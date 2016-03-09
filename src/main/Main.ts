const app: Electron.App = require("app");
const browserWindowConstructor: typeof Electron.BrowserWindow = require("browser-window");
import {ipcMain, nativeImage} from "electron";
import menu from "./Menu";
let fixPath = require("fix-path");

let browserWindow: Electron.BrowserWindow = undefined;

// Fix the $PATH on OS X
fixPath();

if (app.dock) {
    app.dock.setIcon(nativeImage.createFromPath("icon.png"));
}

app.on("open-file", (event: Event, file: string) => getMainWindow().webContents.send("change-working-directory", file))
    .on("ready", getMainWindow)
    .on("activate", getMainWindow)
    .on("mainWindow-all-closed", () => process.platform === "darwin" || app.quit())
    .on("will-quit", () => getMainWindow().webContents.send("will-quit"));

ipcMain.on("quit", app.quit);

function getMainWindow(): Electron.BrowserWindow {
    const screen: Electron.Screen = require("screen");
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize;

    if (!browserWindow) {
        let options: Electron.BrowserWindowOptions = {
            webPreferences: {
                experimentalFeatures: true,
                experimentalCanvasFeatures: true,
                overlayScrollbars: true,
            },
            subpixelFontScaling: true,
            titleBarStyle: "hidden",
            resizable: true,
            minWidth: 500,
            minHeight: 300,
            width: workAreaSize.width,
            height: workAreaSize.height,
            show: false,
        };
        browserWindow = new browserWindowConstructor(options);

        browserWindow.loadURL("file://" + __dirname + "/../views/index.html");
        menu.setMenu(app, browserWindow);

        browserWindow.on("closed", (): void => browserWindow = undefined)
                     .on("focus", (): void => app.dock && app.dock.setBadge(""));

        browserWindow.webContents.on("did-finish-load", () => {
            browserWindow.show();
            browserWindow.focus();
        });
    }

    return browserWindow;
}
