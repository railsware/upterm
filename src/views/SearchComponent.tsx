import * as React from "react";
import * as css from "./css/main";
import {remote} from "electron";
import {fontAwesome} from "./css/FontAwesome";

export class SearchComponent extends React.Component<{}, {}> {
    private webContents: Electron.WebContents = remote.BrowserWindow.getAllWindows()[0].webContents;

    constructor() {
        super();
        // FIXME: find a better design.
        window.search = this;
    }

    render() {
        return (
            <div style={css.search}>
                <span style={css.searchIcon} dangerouslySetInnerHTML={{__html: fontAwesome.search}}/>
                <input
                    ref="input"
                    style={css.searchInput}
                    onInput={(event: any) => this.handleInput(event)}
                    type="search"/>
            </div>
        );
    }

    get isFocused(): boolean {
        return document.activeElement === this.input;
    }

    clearSelection(): void {
        this.webContents.stopFindInPage("clearSelection");
        this.input.value = "";
    }

    private handleInput(event: React.KeyboardEvent<HTMLInputElement>) {
        const text = event.target.value;

        if (text) {
            this.webContents.findInPage(text);
            this.webContents.on("found-in-page", () => this.input.focus());
        } else {
            this.clearSelection();
            setTimeout(() => this.input.select(), 0);
        }
    }

    private get input(): HTMLInputElement {
        /* tslint:disable:no-string-literal */
        return this.refs["input"] as HTMLInputElement;
    }
}
