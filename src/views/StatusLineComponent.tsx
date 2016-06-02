/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

const CurrentDirectory = ({currentWorkingDirectory}: { currentWorkingDirectory: string }) =>
    <div style={css.statusLine.currentDirectory}>
        <span style={css.statusLine.icon} dangerouslySetInnerHTML={{__html: fontAwesome.folderOpen}}/>
        {currentWorkingDirectory}
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

export const StatusLineComponent = ({currentWorkingDirectory, vcsData}: { currentWorkingDirectory: string; vcsData: VcsData | undefined }) =>
    <div style={css.statusLine.itself}>
        <CurrentDirectory currentWorkingDirectory={currentWorkingDirectory}/>
        <VcsDataComponent data={vcsData}/>
    </div>;
