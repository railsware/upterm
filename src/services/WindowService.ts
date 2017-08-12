import {remote} from "electron";
import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/map";
import "rxjs/add/operator/do";
import {NeverObservable} from "rxjs/observable/NeverObservable";

export class WindowService {
    readonly onResize: Observable<{}>;
    readonly onBoundsChange: Observable<Electron.Rectangle>;

    constructor() {
        if (remote) {
            const electronWindow = remote.BrowserWindow.getAllWindows()[0];

            this.onResize = Observable.fromEvent(electronWindow, "resize")
                .merge(Observable.fromEvent(electronWindow.webContents, "devtools-opened"))
                .merge(Observable.fromEvent(electronWindow.webContents, "devtools-closed"));

            this.onBoundsChange = Observable.fromEvent(electronWindow, "move")
                .merge(Observable.fromEvent(electronWindow, "resize"))
                .map(() => electronWindow.getBounds());
        } else {
            this.onResize = new NeverObservable();
            this.onBoundsChange = new NeverObservable();
        }
    }
}
