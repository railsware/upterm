/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

const PresentWorkingDirectory = ({presentWorkingDirectory}: { presentWorkingDirectory: string }) =>
    <div style={css.statusLine.presentDirectory}>
        <span style={css.statusLine.icon} dangerouslySetInnerHTML={{__html: fontAwesome.folderOpen}}/>
        {presentWorkingDirectory}
    </div>;

const VcsDataComponent = ({data}: { data: VcsData | undefined }) => {
    if (data) {
        return (
            <div style={css.statusLine.vcsData}>
                <div style={css.statusLine.status(data.status)}>
                    <span style={css.statusLine.icon} dangerouslySetInnerHTML={{__html: fontAwesome.codeFork}}/>
                    {data.branch}
                </div>
            </div>
        );
    } else {
        return <div></div>;
    }
};

export const StatusLineComponent = ({presentWorkingDirectory, vcsData}: { presentWorkingDirectory: string; vcsData: VcsData | undefined }) =>
    <div style={css.statusLine.itself}>
        <PresentWorkingDirectory presentWorkingDirectory={presentWorkingDirectory}/>
        <VcsDataComponent data={vcsData}/>
    </div>;
