import {app, nativeImage, BrowserWindow, screen, globalShortcut, Menu} from "electron";
import {readFileSync} from "fs";
import {windowBoundsFilePath} from "../utils/Common";
import {buildMenuTemplate} from "./Menu";

/**
 * Contains references to all currently open windows.
 *
 * @type {Array}
 */
let windows: Electron.BrowserWindow[] = [];

/**
 * The index of the currently focussed window in `windows`.
 *
 * @type {number}
 */
let focussedWindowIndex: number;

if (app.dock) {
    app.dock.setIcon(nativeImage.createFromPath("build/icon.png"));
}

app.on("ready", () => {
    createWindow();
    registerApplicationMenu();

    globalShortcut.register("CommandOrControl+N", () => {
        createWindow();
    });
});

app.on("window-all-closed", () => {
    // On OSX the app usually keeps running until Cmd+Q'd.
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("open-file", (_event, file) => {
    if (focussedWindowIndex > -1) {
        windows[focussedWindowIndex].webContents.send("change-working-directory", file);
    }
});

/**
 * Create a new terminal window and push it to `windows`.
 */
export function createWindow() {
    const bounds = windowBounds();

    let options: Electron.BrowserWindowOptions = {
        webPreferences: {
            experimentalFeatures: true,
            experimentalCanvasFeatures: true,
        },
        titleBarStyle: "hidden",
        resizable: true,
        minWidth: 500,
        minHeight: 300,
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        show: false,
    };
    const browserWindow = new BrowserWindow(options);

    if (process.env.REACT_EXTENSION_PATH) {
        BrowserWindow.addDevToolsExtension(process.env.REACT_EXTENSION_PATH);
    }

    browserWindow.loadURL("file://" + __dirname + "/../views/index.html");

    browserWindow.on("focus", () => {
        if (app.dock) {
            app.dock.setBadge("");
        }
        setFocssedWindow(browserWindow);
    });

    browserWindow.webContents.on("did-finish-load", () => {
        browserWindow.show();
        browserWindow.focus();
    });

    browserWindow.on("closed", () => {
        closeWindow(browserWindow);
    });

    windows.push(browserWindow);
}

/**
 * Remove a window from the `windows` list.
 *
 * @param {BrowserWindow} browserWindow the window to remove
 */
function closeWindow(browserWindow: Electron.BrowserWindow) {
    let index = windows.indexOf(browserWindow);
    windows.splice(index, 1);

    // Focus next window
    let next_window = Math.min(index, windows.length);
    if (next_window > -1) {
        windows[next_window].focus();
    } else {
        focussedWindowIndex = -1;
    }
}

/**
 * Set `focussedWindowIndex` to the index of the passed-in BrowserWindow.
 *
 * @param {Electron.BrowserWindow} browserWindow
 */
function setFocssedWindow(browserWindow: Electron.BrowserWindow) {
    focussedWindowIndex = windows.indexOf(browserWindow);
}

/**
 * Register the global application menu.
 */
function registerApplicationMenu() {
    const template = buildMenuTemplate(app);
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/**
 * Get the maximum possible window dimensions on the display.
 *
 * @return {Electron.Rectangle}
 */
function windowBounds(): Electron.Rectangle {
    try {
        return JSON.parse(readFileSync(windowBoundsFilePath).toString());
    } catch (error) {
        const workAreaSize = screen.getPrimaryDisplay().workAreaSize;

        return {
            width: workAreaSize.width,
            height: workAreaSize.height,
            x: 0,
            y: 0,
        };
    }
}
