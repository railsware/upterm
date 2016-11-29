/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {watchManager} from "../plugins/GitWatcher";

const VcsDataComponent = ({data}: { data: VcsData }) => {
    if (data.kind === "repository") {
        return (
            <div style={css.statusBar.vcsData}>
                <span style={css.statusBar.status(data.status)}>
                    {(data.status === "dirty") ?
                      (<span>
                        <span style={css.statusBar.stagedFileChanges}>
                          {data.changes.stagedChanges}
                        </span>
                        {(data.changes.stagedChanges === "") ? "" : "| "}
                        <span style={css.statusBar.unstagedFileChanges}>
                          {data.changes.unstagedChanges}
                        </span>
                      </span>) :
                      undefined
                    }
                    <span style={css.statusBar.icon} dangerouslySetInnerHTML={{__html: fontAwesome.longArrowDown}}/>
                    {data.pull}
                    <span style={css.statusBar.icon} dangerouslySetInnerHTML={{__html: fontAwesome.longArrowUp}}/>
                    {data.push}
                    <span style={css.statusBar.icon} dangerouslySetInnerHTML={{__html: fontAwesome.codeFork}}/>
                    {data.branch}
                </span>
            </div>
    );
    } else {
        return <div></div>;
    }
};

export const StatusBarComponent = ({presentWorkingDirectory}: { presentWorkingDirectory: string }) =>
    <div style={css.statusBar.itself}>
        <span style={css.statusBar.icon} dangerouslySetInnerHTML={{__html: fontAwesome.folderOpen}}/>
        <span style={css.statusBar.presentDirectory}>{presentWorkingDirectory}</span>
        <VcsDataComponent data={watchManager.vcsDataFor(presentWorkingDirectory)}/>
    </div>;
