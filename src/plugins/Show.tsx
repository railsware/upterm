import * as _ from "lodash";
import * as React from "react";
import {homeDirectory, pluralize, resolveDirectory, resolveFile, mapObject} from "../utils/Common";
import {existsSync, statSync} from "fs";
import {PluginManager} from "../PluginManager";
import {Job} from "../shell/Job";

PluginManager.registerOutputDecorator({
    decorate: (job: Job): React.ReactElement<any> => {
        const rows = job.screenBuffer.toLines().map(row => {
            let fullPath: string = "hello";

            fullPath = job.environment.cdpath.map(path => resolveDirectory(path, row))[0].slice(0, -1);

            return <img src={fullPath}/>;
        });

        return <pre className="output">{rows}</pre>;
    },

    isApplicable: (job: Job): boolean => {
        return job.hasOutput() && (job.prompt.expanded.map(token => token.value)[0] === "show");
    },
});
