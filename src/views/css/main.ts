import {Buffer, Status} from "../../Enums";
import * as colors from "./colors";

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

const infoPanel = {
    padding: "8px 0 6px 0.6em",
    minHeight: "2em",
    lineHeight: 1.3,
    backgroundColor: colors.panel,
};

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
    };

    export const description = Object.assign(
        {
            display: "block",
            boxShadow: "0 4px 8px 1px rgba(0, 0, 0, 0.3)",
            position: "absolute",
            left: 0,
            right: 0,
            fontSize: "0.8em",
        },
        infoPanel
    );

    export const icon = {
        fontFamily: "FontAwesome",
        display: "inline-block",
        content: ' ',

        width: "2em",
        height: "2em",
        lineHeight: "2em",


        verticalAlign: "middle",
        textAlign: "center",
        fontStyle: "normal",

        opacity: ".5",
        marginRight: 10,

        backgroundColor: "rgba(0, 0, 0, 0.15)",
    }
}
