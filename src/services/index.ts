import {FontService} from "./FontService";
import {HistoryService} from "./HistoryService";
import {UpdatesService} from "./UpdatesService";

// To help IDE with "find usages" and "go to definition".
interface Services {
    font: FontService;
    history: HistoryService;
    updates: UpdatesService;
}

export const services: Services = {
    font: FontService.instance,
    history: HistoryService.instance,
    updates: UpdatesService.instance,
};
