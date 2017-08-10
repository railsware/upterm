import {services} from "../services/index";
import {outputJSON} from "fs-extra";
import {presentWorkingDirectoryFilePath} from "../utils/Common";

services.sessions.afterJob.subscribe(job =>
    outputJSON(presentWorkingDirectoryFilePath, job.session.directory),
);
