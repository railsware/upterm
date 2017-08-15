import {services} from "../services/index";
import {outputJSON} from "fs-extra";
import {presentWorkingDirectoryFilePath} from "../utils/Common";

services.jobs.onFinish.subscribe(job =>
    outputJSON(presentWorkingDirectoryFilePath, job.session.directory),
);
