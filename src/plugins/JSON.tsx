import * as React from "react";
import {Job} from "../shell/Job";
import {PluginManager} from "../PluginManager";
import JsonTree from "../utils/JSONTree";

PluginManager.registerOutputDecorator({
    decorate: (job: Job): React.ReactElement<any> => {
        return <JsonTree data={JSON.parse(job.screenBuffer.toString())}/>;
    },

    isApplicable: (job: Job): boolean => {
        try {
            JSON.parse(job.screenBuffer.toString());
            return true;
        } catch (exception) {
            return false;
        }
    },
});
