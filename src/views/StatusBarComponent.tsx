/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

const PresentWorkingDirectory = ({presentWorkingDirectory}: { presentWorkingDirectory: string }) =>
    <div style={css.statusBar.presentDirectory}>
        <span style={css.statusBar.icon} dangerouslySetInnerHTML={{__html: fontAwesome.folderOpen}}/>
        {presentWorkingDirectory}
    </div>;

const VcsDataComponent = ({data}: { data: VcsData | undefined }) => {
    if (data) {
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

export const StatusBarComponent = ({presentWorkingDirectory, vcsData}: { presentWorkingDirectory: string; vcsData: VcsData | undefined }) =>
    <div style={css.statusBar.itself}>
        <PresentWorkingDirectory presentWorkingDirectory={presentWorkingDirectory}/>
        <VcsDataComponent data={vcsData}/>
    </div>;
