/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {watchManager} from "../plugins/GitWatcher";

const PresentWorkingDirectory = ({presentWorkingDirectory}: { presentWorkingDirectory: string }) =>
    <div style={css.statusBar.presentDirectory}>
        <span style={css.statusBar.icon} dangerouslySetInnerHTML={{__html: fontAwesome.folderOpen}}/>
        {presentWorkingDirectory}
    </div>;

const VcsDataComponent = ({data}: { data: VcsData }) => {
    if (data.kind === "repository") {
        return (
            <div style={css.statusBar.vcsData}>
                <div style={css.statusBar.status(data.status)}>
                    <span style={css.statusBar.icon} dangerouslySetInnerHTML={{__html: fontAwesome.codeFork}}/>
                    {data.branch}
                </div>
            </div>
        );
    } else {
        return <div></div>;
    }
};

export const StatusBarComponent = ({presentWorkingDirectory}: { presentWorkingDirectory: string }) =>
    <div style={css.statusBar.itself}>
        <PresentWorkingDirectory presentWorkingDirectory={presentWorkingDirectory}/>
        <VcsDataComponent data={watchManager.vcsDataFor(presentWorkingDirectory)}/>
    </div>;
