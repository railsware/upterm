import {FontService} from "./FontService";
import {HistoryService} from "./HistoryService";
import {UpdatesService} from "./UpdatesService";
import {GitService} from "./GitService";
import {SessionsService} from "./SessionsService";
import {WindowService} from "./WindowService";

// To help IDE with "find usages" and "go to definition".
interface Services {
    font: FontService;
    history: HistoryService;
    updates: UpdatesService;
    git: GitService;
    sessions: SessionsService;
    window: WindowService;
}

export const services: Services = {
    font: new FontService(),
    history: new HistoryService(),
    updates: new UpdatesService,
    git: new GitService(),
    sessions: new SessionsService(),
    window: new WindowService(),
};
