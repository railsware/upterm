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
    isUpdateAvailable = true;
    private INTERVAL = 1000 * 60 * 60 * 12;

    static get instance() {
        if (!this._instance) {
            this._instance = new ReleaseTracker();
        }

        return this._instance;
    };

    private constructor() {
        setInterval(
            () => {
                let version = "v0.2.161";
                https.get(
                    {
                        host: 'api.github.com',
                        path: '/repos/railsware/upterm/releases/latest',
                        headers: {
                            'User-Agent': 'Upterm',
                        },
                    },
                    (response) => {
                        // Continuously update stream with data
                        var body = '';
                        response.on('data', function(d) {
                            body += d;
                        });
                        response.on('end', function() {
                            // Data reception is done, do whatever with it!
                            var parsed = JSON.parse(body);
                            version = parsed['tag_name'];
                            console.log(parsed['tag_name']);
                        });
                    }
                );
                const currentVersion = remote.app.getVersion();
                this.isUpdateAvailable = version !== 'v' + currentVersion;
            },
            this.INTERVAL,
        );
    }
}

const ReleaseComponent = () => {
    if (ReleaseTracker.instance.isUpdateAvailable) {
        return (
            <span
                className="release-component-link"
                onClick={() => shell.openExternal("https://github.com/railsware/upterm/releases")}>
                Download New Release
            </span>
        );
    } else {
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
