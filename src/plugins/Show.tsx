import * as React from "react";
import {PluginManager} from "../PluginManager";
import {Job} from "../shell/Job";

PluginManager.registerOutputDecorator({
    decorate: (job: Job): React.ReactElement<any> => {
        const rows = job.screenBuffer.toLines().map(path => <img src={path}/>);

        return <pre className="output">{rows}</pre>;
    },

    isApplicable: (job: Job): boolean => {
        return job.hasOutput() && (job.prompt.commandName.value === "show");
    },
});
