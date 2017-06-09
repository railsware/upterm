/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {watchManager} from "../plugins/GitWatcher";
import {shell} from "electron";

const VcsDataComponent = ({data}: { data: VcsData }) => {
    if (data.kind === "repository") {
        let remoteOrigin: string;

        if (data.origin.includes("github.com") || data.origin.includes("gitlab.com")) {
            remoteOrigin = `${data.origin}/tree/${data.branch}`
        } else if (data.origin.includes("bitbucket.org")) {
            remoteOrigin = `${data.origin}/branch/${data.branch}`
        }

        function openBrowser() {
            shell.openExternal(remoteOrigin)
        }

        return (
            <div style={css.statusBar.vcsData}>
                <span style={css.statusBar.status(data.status)} onClick={openBrowser}>
                    <span style={css.statusBar.icon}>{fontAwesome.codeFork}</span>
                    {data.branch}
                </span>
            </div>
        );
    } else {
        return <div></div>;
    }
};

export const StatusBarComponent = ({presentWorkingDirectory}: { presentWorkingDirectory: string }) => {
    function openFolder() {
        shell.openExternal(`file://${presentWorkingDirectory}`)
    }

    return (
        <div className="status-bar" style={css.statusBar.itself}>
            <span style={css.statusBar.icon}>{fontAwesome.folderOpen}</span>
            <span className="present-directory" style={css.statusBar.presentDirectory} onClick={openFolder}>
                {presentWorkingDirectory}
            </span>
            <VcsDataComponent data={watchManager.vcsDataFor(presentWorkingDirectory)}/>
        </div>
    );
};
