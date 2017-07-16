/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as css from "./css/styles";
import {watchManager} from "../plugins/GitWatcher";
import {Session} from "../shell/Session";
import {userFriendlyPath} from "../utils/Common";

const VcsDataComponent = ({data}: { data: VcsData }) => {
    if (data.kind === "repository") {
        return (
            <span className="vcs-data" style={css.footer.status(data.status)}>
                {data.branch}
            </span>
    );
    } else {
        return <div/>;
    }
};

interface Props {
    session: Session;
}

export class FooterComponent extends React.Component<Props, {}> {
    render() {
        return (
            <div className="footer">
                <span className="status-bar">
                    <span className="present-directory">{userFriendlyPath(this.props.session.directory)}</span>
                    <VcsDataComponent data={watchManager.vcsDataFor(this.props.session.directory)}/>
                </span>
            </div>
        );
    }
}
