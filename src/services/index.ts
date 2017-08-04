import {FontService} from "./FontService";
import {HistoryService} from "./HistoryService";
import {UpdatesService} from "./UpdatesService";
import {GitService} from "./GitService";

// To help IDE with "find usages" and "go to definition".
interface Services {
    font: FontService;
    history: HistoryService;
    updates: UpdatesService;
    git: GitService;
}

export const services: Services = {
    font: FontService.instance,
    history: HistoryService.instance,
    updates: UpdatesService.instance,
    git: new GitService(),
};
