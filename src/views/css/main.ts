import {Buffer, Status} from "../../Enums";
import {colors, panel as panelColor, background as backgroundColor} from "./colors";
import {TabHoverState} from "../TabComponent";
import {darken, lighten, failurize} from "./functions";

export interface CSSObject {
    pointerEvents?: string;
    marginBottom?: number;
    padding?: string | number;
    minHeight?: number;
    height?: number | string;
    margin?: number | string;
    listStyleType?: "none";
    backgroundColor?: string;
    cursor?: "pointer" | "help";
    color?: string;
    width?: string;
    flex?: number;
    overflowX?: "scroll";
    outline?: "none";
    opacity?: number;
    boxShadow?: string;
    zoom?: number;
    position?: "fixed" | "relative";
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    zIndex?: number;
    gridArea?: string,
}

const fontSize = 14;
const outputPadding = 10;
const promptPadding = 5;
const promptHeight = 12 + (2 * promptPadding);
const promptBackgroundColor = lighten(colors.black, 5);
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

    const icon = {
        fontFamily: "FontAwesome",
    };

    export const application = {
        marginBottom: 24,
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

    export const suggestionIcon = Object.assign(
        {},
        icon,
        {
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
        }
    );

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
        icon: Object.assign({}, icon, {marginRight: 5}),
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
    
    export const tab = (isHovered: boolean, isActive: boolean) => {
        return {
            backgroundColor: isHovered ? panelColor : colors.black,
            opacity:  (isHovered || isActive) ? 1 : 0.3,
            position: "relative",
            height: titleBarHeight,
            width: 150,
            display: "inline-block",
            textAlign: "center",
            paddingTop: 2,
        }
    };

    export const tabClose = (hover: TabHoverState) => {
        const margin = titleBarHeight - fontSize;

        return Object.assign(
            {},
            icon,
            {
                color: tabCloseButtonColor(hover),
                position: "absolute",
                left: margin,
                top: margin / 2,
            }
        );
    };

    export const commandSign = {
        fontSize: fontSize + 3,
        verticalAlign: "middle",
    };

    // To display even empty rows. The height might need tweaking.
    // TODO: Remove if we always have a fixed buffer width.
    export const charGroup = {
        display: "inline-block",
        height: rowHeight,
    };

    const outputPadding = 10;

    const outputCutHeight = fontSize * 2.6;
    export const outputCut = (isHovered: boolean) => Object.assign(
        {},
        jaggedBorder(isHovered ? 0 : 0),
        {
            position: "relative",
            top: -10,
            width: "100%",
            height: outputCutHeight,
            textAlign: "center",
            paddingTop: (outputCutHeight - fontSize) / 3,
            color: lighten(backgroundColor, isHovered ? 35 : 30),
            cursor: "pointer"
        }
    );

    export const outputCutIcon = Object.assign({marginRight: 10}, icon);

    export const output = (buffer: Buffer, status: Status) => {
        const styles: CSSObject = {
            padding: `${outputPadding}px ${buffer === Buffer.Alternate ? 0 : outputPadding}px`,
        };

        if (buffer === Buffer.Alternate) {
            if ([Status.Failure, Status.Interrupted, Status.Success].includes(status)) {
                styles.zoom = 0.1;
            }

            if (status === Status.InProgress) {
                styles.position = "fixed";
                styles.top = titleBarHeight;
                styles.bottom = 0;
                styles.left = 0;
                styles.right = 0;
                styles.zIndex = 4;

                styles.margin = 0;
                styles.padding = "5px 0 0 0";
            }
        } else {
            if ([Status.Failure, Status.Interrupted].includes(status)) {
                styles.backgroundColor = failurize(backgroundColor);
            }
        }

        return styles;
    };

    export const actions = {
        gridArea: "actions",
        marginRight: 15,
        textAlign: "right",
    };

    export const action = Object.assign(
        {
            textAlign: "center",
            width: fontSize,
            display: "inline-block",
            margin: "0 3px",
            cursor: "pointer",
        },
        icon
    );
    
    export const decorationToggle = (isEnabled: boolean) => {
        return Object.assign(
            {},
            action,
            {
                color: isEnabled ? colors.green : colors.white,
            }
        )
    };

    const promptInlineElement = {
        padding: "0 10px 3px 10px", // FIXME: Use grid-column-gap when it's supported.
        gridArea: "prompt",
        fontSize: fontSize,
        WebkitFontFeatureSettings: '"liga", "dlig"',
        whiteSpace: "pre-wrap",
        WebkitAppearance: "none",
        outline: "none",
    };

    export const inlineSynopsis = Object.assign(
        {},
        promptInlineElement,
        {
            color: colors.yellow,
            opacity: 0.4,
        }
    );

    export const autocompletedPreview = Object.assign(
        {},
        promptInlineElement,
        {
            color: lighten(promptBackgroundColor, 15),
        }
    );

    export const prompt = Object.assign(
        {},
        promptInlineElement,
        {
            color: colors.white,
            zIndex: 2,
        }
    );

    export const promptInfo = (status: Status) => {
        const styles: CSSObject = {
            cursor: "help",
            zIndex: 2,
            gridArea: "decoration",
        };

        if (status === Status.Interrupted) {
            Object.assign(styles, icon);

            styles.position = "relative";
            styles.left = 6;
            styles.top = 1;
            styles.color = colors.black
        }

        return styles;
    };
}

function tabCloseButtonColor(hover: TabHoverState) {
    if (hover === TabHoverState.Close) {
        return colors.red;
    } else if (hover === TabHoverState.Tab) {
        return colors.white;
    } else {
        return "transparent";
    }
}

function jaggedBorder(darkenPercent: number) {
    return {
        background: `-webkit-linear-gradient(${darken(panelColor, darkenPercent)} 0%, transparent 0%),
                     -webkit-linear-gradient(135deg, ${backgroundColor} 33.33%, transparent 33.33%) 0 0,
                     ${backgroundColor} -webkit-linear-gradient(45deg, ${backgroundColor} 33.33%,
                     ${darken(panelColor, darkenPercent)} 33.33%) 0 0`,
        backgroundRepeat: "repeat-x",
        backgroundSize: "0 100%, 15px 50px, 15px 50px",
    }
}
