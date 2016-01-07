import * as _ from "lodash";
import * as React from "react";
import PluginManager from "../PluginManager";
import Job from "../Job";

PluginManager.registerOutputDecorator({
    decorate: (job: Job): React.ReactElement<any> => {
        var rows = job.getBuffer().toLines().map((row: string) => {
            if (/^\s*\+/.test(row)) {
                return React.createElement("div", { className: "git-diff-new" }, null, row.replace(/^\++/, ''));
            } else if (/^\s*-/.test(row)) {
                return React.createElement("div", { className: "git-diff-old" }, null, row.replace(/^-+/, ''));
            }
            return React.createElement("div", {}, null, row);
        });

        return React.createElement("pre", { className: "output" }, rows, null);
    },

    isApplicable: (job: Job): boolean => {
        return job.hasOutput() && _.isEqual(job.prompt.expanded, ["git", "diff"]);
    }
});
