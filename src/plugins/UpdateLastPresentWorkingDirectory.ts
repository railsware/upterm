import {services} from "../services/index";
import {outputJSON} from "fs-extra";
import {presentWorkingDirectoryFilePath} from "../utils/Common";

services.sessions.jobFinishedObservable.subscribe(job =>
    outputJSON(presentWorkingDirectoryFilePath, job.session.directory),
);
