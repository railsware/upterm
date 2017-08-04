import {HistoryRecord, HistoryService} from "../../services/HistoryService";
import {fuzzyMatch} from "../../utils/Common";
import {scan} from "../../shell/Scanner";
import {isAbsolute} from "path";

function cdIntoRelativePathFilter(record: HistoryRecord, pwd: string): boolean {
    if (record.directory === pwd) {
        return true;
    }

    const tokens = scan(record.expandedCommand);

    if (tokens[0].value !== "cd") {
        return true;
    }

    const directoryToken = tokens[1];

    if (directoryToken && isAbsolute(directoryToken.value)) {
        return true;
    }

    return false;
}

export function getMatchingHistoryRecords(currentText: string, pwd: string) {
    return HistoryService.instance.all
        .filter(record => cdIntoRelativePathFilter(record, pwd))
        .map(record => record.command)
        .filter(command => fuzzyMatch(currentText, command))
        .reverse();
}
