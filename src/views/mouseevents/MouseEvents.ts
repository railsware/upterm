import {ApplicationComponent} from "../ApplicationComponent";
import {MouseEvent} from "../../Interfaces";
import * as fs from "fs";
import {userFriendlyPath, escapeFilePath, normalizeDirectory} from "../../utils/Common";
import {Status} from "../../Enums";

function isDirectory(path: string): boolean {
    return fs.lstatSync(path).isDirectory();
}

export function handleMouseEvent(application: ApplicationComponent, event: MouseEvent) {
    const sessionComponent = application.focusedTabComponent.focusedSessionComponent;
    if (!sessionComponent) {
        return;
    }

    const isJobRunning = sessionComponent.status === Status.InProgress;
    const promptComponent = sessionComponent.promptComponent;

    if (event instanceof DragEvent) {
        const path = event.dataTransfer.files[0].path;
        let formattedPath = userFriendlyPath(escapeFilePath(path));

        if (isDirectory(path)) {
            formattedPath = normalizeDirectory(formattedPath);
        }

        if (!isJobRunning) {
            promptComponent.insertValueInPlace(formattedPath);
        }

        event.preventDefault();
        return;
    }
}
