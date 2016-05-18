import {Buffer, Status} from "../../Enums";

export interface CSSObject {
    pointerEvents?: string;
    marginBottom?: number;
    padding?: string;
    minHeight?: number;
    height?: number;
    margin?: number;
}

const fontSize = 14;
const rowHeight = fontSize + 4;
const outputPadding = 10;

export namespace css {
    const inactiveJobs: CSSObject = {
        pointerEvents: "none",
    };

    const commonJobs: CSSObject = {
        marginBottom: 40,
    };

    export const jobs = (isSessionActive: boolean): CSSObject =>
        isSessionActive ? commonJobs : Object.assign({}, commonJobs, inactiveJobs);

    export const row = (jobStatus: Status, activeBuffer: Buffer) => {
        const style: CSSObject = {
            padding: `0 ${outputPadding}`,
            minHeight: rowHeight,
        };

        if (activeBuffer === Buffer.Alternate) {
            if ([Status.Failure, Status.Interrupted, Status.Success].includes(jobStatus)) {
                style.height = 70;
            } else if (Status.InProgress === jobStatus) {
                style.margin = 0;
            }
        }

        return style;
    }
}
