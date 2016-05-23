import {Buffer, Status} from "../../Enums";
import {colors, panel as panelColor} from "./colors";

export interface CSSObject {
    pointerEvents?: string;
    marginBottom?: number;
    padding?: string | number;
    minHeight?: number;
    height?: number | string;
    margin?: number | string;
    listStyleType?: "none";
    backgroundColor?: string;
    cursor?: "pointer";
    width?: string;
    flex?: number;
    overflowX?: "scroll";
    outline?: "none";
    opacity?: number;
    boxShadow?: string;
}

const fontSize = 14;
const outputPadding = 10;
const promptPadding = 5;
const promptHeight = 12 + (2 * promptPadding);
const defaultShadow = "0 2px 8px 1px rgba(0, 0, 0, 0.3)";
export const titleBarHeight = 24;
export const rowHeight = fontSize + 4;
export const letterWidth = fontSize / 2 + 1.5;

const infoPanel = {
    padding: "8px 0 6px 0.6em",
    minHeight: "2em",
    lineHeight: 1.3,
    backgroundColor: panelColor,
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

        width: "2em",
        height: "2em",
        lineHeight: "2em",


        verticalAlign: "middle",
        textAlign: "center",
        fontStyle: "normal",

        opacity: ".5",
        marginRight: 10,

        backgroundColor: "rgba(0, 0, 0, 0.15)",
    };

    export const debugTag = {
        color: "red",
        float: "right",
    };

    export const autocomplete = {
        box: (caretOffset: Offset) => {
            return {
                position: "absolute",
                top: promptHeight,
                left: caretOffset.left,
                minWidth: 300,
                boxShadow: defaultShadow,
                backgroundColor: colors.black
            };
        },
        synopsis: {
            float: "right",
            opacity: 0.5,
            fontSize: "0.8em",
            marginTop: "0.65em",
            marginRight: 5,
        },
        value: {
            paddingRight: 30,
        },
        item: (isHighlighted: boolean) => {
            const style: CSSObject = {
                listStyleType: "none",
                padding: 2,
                cursor: "pointer",
            };

            if (isHighlighted) {
                style.backgroundColor = "#383E4A";
            }

            return style;
        },
        suggestionsList: {
            maxHeight: 300,
            overflow: "auto",
            padding: 0,
            margin: 0,
        }
    };
    
    export const statusLine = {
        itself: Object.assign(
            {},
            infoPanel,
            {
                position: "fixed",
                bottom: 0,
                width: "100%",
                zIndex: 3,
            }
        ),
        currentDirectory: {
            display: "inline-block",
        },
        vcsData: {
            display: "inline-block",
            float: "right",
            marginRight: 10,
        },
        icon: {
            fontFamily: "FontAwesome",
            marginRight: 5,
        },
        status: (status: VcsStatus) => {
            return {
                color: status === "dirty" ? colors.blue : colors.white,
                display: "inline-block",
            };
        }
    };

    export const session = (isActive: boolean) => {
        const styles: CSSObject = {
            height: "100%",
            width: "100%",
            flex: 1,
            overflowX: "scroll",
        };

        if (isActive) {
            styles.outline = "none";
        } else {
            styles.opacity = 0.4;
            styles.boxShadow = `0 0 0 1px ${colors.white}`;
            styles.margin = "0 0 1px 1px";
        }

        return styles;
    };

    export const activeTabContent = {
        display: "flex",
        flexWrap: "nowrap",
        flexDirection: "column",
        position: "absolute",
        width: "100%",
        top: titleBarHeight,
        bottom: "2em",
    };

    export const tabs = {
        height: titleBarHeight,
        display: "flex",
        justifyContent: "center",
        WebkitMarginBefore: 0,
        WebkitMarginAfter: 0,
        WebkitPaddingStart: 0,
        WebkitUserSelect: "none",
    };
}
