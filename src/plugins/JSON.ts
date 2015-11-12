import * as React from 'react';
import Job from "../Job";
import PluginManager from "../PluginManager";
var JSONTree = require('../../../decorators/json');

PluginManager.registerOutputDecorator({
    decorate: (job: Job): React.ReactElement<any> => {
        return React.createElement(JSONTree, { data: JSON.parse(job.getBuffer().toString()) });
    },

    isApplicable: (job: Job): boolean => {
        try {
            JSON.parse(job.getBuffer().toString());
            return true;
        } catch (exception) {
            return false;
        }
    }
});
