/* tslint:disable:no-unused-variable */
import * as React from "react";
import {css} from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

const CurrentDirectory = ({currentWorkingDirectory}: { currentWorkingDirectory: string }) =>
    <div style={css.statusLine.currentDirectory}>
        <span style={css.statusLine.icon} dangerouslySetInnerHTML={{__html: fontAwesome.folderOpen}}/>
        {currentWorkingDirectory}
    </div>;

const VcsDataComponent = ({data}: { data: VcsData }) => {
    if (!data.isRepository) {
        /* tslint:disable:no-null-keyword */
        return null;
    }

    return (
        <div style={css.statusLine.vcsData}>
            <div style={css.statusLine.status(data.status)}>
                <span style={css.statusLine.icon} dangerouslySetInnerHTML={{__html: fontAwesome.codeFork}}/>
                {data.branch}
            </div>
        </div>
    );
};

const StatusLine = ({currentWorkingDirectory, vcsData}: { currentWorkingDirectory: string; vcsData: VcsData }) =>
    <div style={css.statusLine.itself}>
        <CurrentDirectory currentWorkingDirectory={currentWorkingDirectory}/>
        <VcsDataComponent data={vcsData}/>
    </div>;

export default StatusLine;
