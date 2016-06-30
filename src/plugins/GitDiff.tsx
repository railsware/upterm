import * as _ from "lodash";
import * as React from "react";
import {PluginManager} from "../PluginManager";
import {Job} from "../shell/Job";

PluginManager.registerOutputDecorator({
    decorate: (job: Job): React.ReactElement<any> => {
        const rows = job.screenBuffer.toLines().map(row => {
            if (/^\s*\+/.test(row)) {
                return <div className="git-diff-new">{row.replace(/^\++/, "")}</div>;
            } else if (/^\s*-/.test(row)) {
                return <div className="git-diff-old">{row.replace(/^-+/, "")}</div>;
            }
            return <div>{row}</div>;
        });

        return <pre className="output">{rows}</pre>;
    },

    isApplicable: (job: Job): boolean => {
        return job.hasOutput() && _.isEqual(job.prompt.expanded.map(token => token.value), ["git", "diff"]);
    },
});
