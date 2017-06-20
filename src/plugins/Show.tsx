import * as React from "react";
import {PluginManager} from "../PluginManager";
import {Job} from "../shell/Job";
import * as css from "../views/css/main";

PluginManager.registerPrettyfier({
    prettify: (job: Job): React.ReactElement<any> => {
        const rows = job.output.toLines().map(path => <img style={css.image} src={path}/>);

        return <div>{rows}</div>;
    },

    isApplicable: (job: Job): boolean => {
        return job.hasOutput() && (job.prompt.commandName === "show");
    },
});
