const app = require("app");
const BrowserWindow = require("browser-window");
const IPC = require("electron").ipcMain;
let menu = require("./Menu");
let fixPath = require("fix-path");

let browserWindow: any = null;

// Fix the $PATH on OS X
fixPath();

app.on("open-file", (event: Event, file: string) => getMainWindow().webContents.send("change-working-directory", file))
    .on("ready", getMainWindow)
    .on("activate-with-no-open-windows", getMainWindow)
    .on("mainWindow-all-closed", () => process.platform === "darwin" || app.quit());

IPC.on("quit", app.quit);

function getMainWindow() {
    const workAreaSize = require("screen").getPrimaryDisplay().workAreaSize;

    if (!browserWindow) {
        browserWindow = new BrowserWindow({
            "web-preferences": {
                "experimental-features": true,
                "experimental-canvas-features": true,
                "subpixel-font-scaling": true,
                "overlay-scrollbars": true
            },
            resizable: true,
            "min-width": 500,
            "min-height": 300,
            width: workAreaSize.width,
            height: workAreaSize.height,
            show: false
        });

        browserWindow.loadURL("file://" + __dirname + "/../views/index.html");
        menu.setMenu(app, browserWindow);

        browserWindow.on("closed", (): void => browserWindow = null);

        browserWindow.webContents.on("did-finish-load", () => {
            browserWindow.show();
            browserWindow.focus();
        });
    }

    return browserWindow;
}
