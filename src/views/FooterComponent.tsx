/* tslint:disable:no-unused-variable */
import {shell, remote} from "electron";
import * as React from "react";
import * as css from "./css/styles";
import {watchManager} from "../plugins/GitWatcher";
import {Session} from "../shell/Session";
import {userFriendlyPath} from "../utils/Common";
import * as https from "https";

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

class ReleaseTracker {
    private static _instance: ReleaseTracker;
    isUpdateAvailable = false;
    private currentVersion = "v" + remote.app.getVersion();
    private INTERVAL = 1000 * 60 * 60 * 12;

    static get instance() {
        if (!this._instance) {
            this._instance = new ReleaseTracker();
        }

        return this._instance;
    }

    private constructor() {
        this.checkUpdate();
        setInterval(() => this.checkUpdate(), this.INTERVAL);
    }

    private checkUpdate() {
        https.get(
            {
                host: "api.github.com",
                path: "/repos/railsware/upterm/releases/latest",
                headers: {
                    "User-Agent": "Upterm",
                },
            },
            (response) => {
                let body = "";
                response.on("data", data => body += data);
                response.on("end", () => {
                    const parsed = JSON.parse(body);
                    this.isUpdateAvailable = parsed.tag_name !== this.currentVersion;
                });
            },
        );
    }
}

const ReleaseComponent = () => {
    if (process.env.NODE_ENV === "production" && ReleaseTracker.instance.isUpdateAvailable) {
        return (
            <span
                className="release-component-link"
                onClick={() => shell.openExternal("http://l.rw.rw/upterm_releases")}>
                Download New Release
            </span>
        );
    } else {
        /* tslint:disable:no-null-keyword */
        return null;
    }
};

interface Props {
    session: Session;
}

export class FooterComponent extends React.Component<Props, {}> {
    render() {
        return (
            <div className="footer">
                <span className="present-directory">{userFriendlyPath(this.props.session.directory)}</span>
                <VcsDataComponent data={watchManager.vcsDataFor(this.props.session.directory)}/>
                <ReleaseComponent />
            </div>
        );
    }
}
