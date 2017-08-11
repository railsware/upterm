import {HistoryRecord} from "../../services/HistoryService";
import {fuzzyMatch} from "../../utils/Common";
import {scan} from "../../shell/Scanner";
import {isAbsolute} from "path";
import {services} from "../../services/index";
import {HistoryTrie} from "../../utils/HistoryTrie";
import {replaceAllPromptSerializer, styles, Suggestion} from "../autocompletion_utils/Common";

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

const historyTrie = new HistoryTrie();
services.history.all.forEach(record => historyTrie.add(record.command));

export function getMatchingHistoryRecords(currentText: string, pwd: string): Suggestion[] {
    const trieSuggestions = historyTrie.getContinuationsFor(currentText).map(continuation => ({
        value: continuation,
        space: true,
        isFiltered: true,
        style: styles.history,
    }));

    if (trieSuggestions.length) {
        return trieSuggestions;
    } else {
        return services.history.all
            .filter(record => cdIntoRelativePathFilter(record, pwd))
            .map(record => record.command)
            .filter(command => fuzzyMatch(currentText, command))
            .map(command => ({
                value: command,
                promptSerializer: replaceAllPromptSerializer,
                isFiltered: true,
                style: styles.history,
            }))
            .reverse();
    }
}
