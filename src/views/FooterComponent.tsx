/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as css from "./css/styles";
import {watchManager} from "../plugins/GitWatcher";
import {Session} from "../shell/Session";
import {Status} from "../Enums";
import * as _ from "lodash";
import {PromptComponent} from "./PromptComponent";
import {userFriendlyPath} from "../utils/Common";

const VcsDataComponent = ({data}: { data: VcsData }) => {
    if (data.kind === "repository") {
        return (
            <span className="vcs-data" style={css.footer.status(data.status)}>
                {data.branch}
            </span>
    );
    } else {
        return <div></div>;
    }
};

interface Props {
    session: Session;
}

export class FooterComponent extends React.Component<Props, {}> {
    promptComponent: PromptComponent;

    render() {
        const lastJob = _.last(this.props.session.jobs);
        const lastJobInProgress = lastJob && lastJob.status === Status.InProgress;

        if (lastJob) {
            lastJob.once("end", () => this.forceUpdate());
        }

        const promptComponent = lastJobInProgress ? undefined : <PromptComponent
            key={this.props.session.jobs.length}
            ref={component => { this.promptComponent = component!; }}
            session={this.props.session}
            isFocused={true}
        />;

        return (
            <div className="footer">
                <span className="information-line">
                    <span className="present-directory">{userFriendlyPath(this.props.session.directory)}</span>
                    <VcsDataComponent data={watchManager.vcsDataFor(this.props.session.directory)}/>
                </span>
                {promptComponent}
            </div>
        );
    }
}
