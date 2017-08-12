import {remote} from "electron";
import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/map";
import "rxjs/add/operator/do";
import {NeverObservable} from "rxjs/observable/NeverObservable";
import {Subject} from "rxjs/Subject";

export class WindowService {
    readonly onResize: Observable<{}>;
    readonly onClose = new Subject<{}>();
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

            window.onbeforeunload = () => {
                electronWindow
                    .removeAllListeners()
                    .webContents
                    .removeAllListeners("devtools-opened")
                    .removeAllListeners("devtools-closed")
                    .removeAllListeners("found-in-page");

                this.onClose.next();
            };
        } else {
            this.onResize = new NeverObservable();
            this.onBoundsChange = new NeverObservable();
        }
    }
}
