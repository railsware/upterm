import {app, ipcMain, nativeImage, BrowserWindow, screen} from "electron";
import menu from "./Menu";


let browserWindow: Electron.BrowserWindow = undefined;

if (app.dock) {
    app.dock.setIcon(nativeImage.createFromPath("icon.png"));
}

app.on("open-file", (event: Event, file: string) => getMainWindow().webContents.send("change-working-directory", file));
app.on("ready", getMainWindow);
app.on("activate", getMainWindow);
app.on("mainWindow-all-closed", () => process.platform === "darwin" || app.quit());

ipcMain.on("quit", app.quit);

function getMainWindow(): Electron.BrowserWindow {
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize;

    if (!browserWindow) {
        let options: Electron.BrowserWindowOptions = {
            webPreferences: {
                experimentalFeatures: true,
                experimentalCanvasFeatures: true,
            },
            titleBarStyle: "hidden",
            resizable: true,
            minWidth: 500,
            minHeight: 300,
            width: workAreaSize.width,
            height: workAreaSize.height,
            show: false,
        };
        browserWindow = new BrowserWindow(options);

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
