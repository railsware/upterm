import * as _ from "lodash";
import * as React from "react";
import PluginManager from "../PluginManager";
import Job from "../Job";

PluginManager.registerOutputDecorator({
    decorate: (job: Job): React.ReactElement<any> => {
        const rows = job.buffer.toLines().map((row: string) => {
            if (/^\s*\+/.test(row)) {
                return React.createElement("div", { className: "git-diff-new" }, undefined, row.replace(/^\++/, ""));
            } else if (/^\s*-/.test(row)) {
                return React.createElement("div", { className: "git-diff-old" }, undefined, row.replace(/^-+/, ""));
            }
            return React.createElement("div", {}, undefined, row);
        });

        return React.createElement("pre", { className: "output" }, rows, undefined);
    },

    isApplicable: (job: Job): boolean => {
        return job.hasOutput() && _.isEqual(job.prompt.expanded, ["git", "diff"]);
    },
});
