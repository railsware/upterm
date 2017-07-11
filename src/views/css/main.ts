import {OutputType, Status, Weight, Brightness} from "../../Enums";
import {colors, colorValue} from "./colors";
import {TabHoverState} from "../TabComponent";
import {darken, lighten, failurize, alpha} from "./functions";
import {Attributes} from "../../Interfaces";
import {CSSObject} from "./definitions";
import {ColumnList, PaneList} from "../../utils/PaneTree";
import {CSSProperties} from "react";


const jobBackgroundColor = colors.black;
const backgroundColor = darken(jobBackgroundColor, 4);
const fontSize = 14;
const promptFontSize = fontSize * 1.1;
export const outputPadding = 10;
const promptHorizontalPadding = 10;
const suggestionSize = 2 * fontSize;
const defaultShadow = "0 2px 8px 1px rgba(0, 0, 0, 0.3)";
export const titleBarHeight = 24;
export const rowHeight = fontSize + 2;
export const statusBarHeight = 55;
export const letterWidth = fontSize / 2 + 1.5;
export const promptLetterWidth = promptFontSize / 2 + 1.5;

const cssVariables = {
    "--font-size": `${fontSize}px`,
    "--title-bar-height": `${titleBarHeight}px`,
    "--status-bar-height": `${statusBarHeight}px`,
    "--content-padding": `${outputPadding}px`,
    "--background-color": backgroundColor,
    "--job-background-color": jobBackgroundColor,
    "--job-background-color-failure": failurize(jobBackgroundColor),
    "--text-color": colors.white,
};

const outputCutHeight = fontSize * 2.6;
const outputCutZIndex = 0;

const decorationWidth = 30;
const searchInputColor = lighten(backgroundColor, 15);

function sessionsGridTemplate(list: PaneList): CSSObject {
    if (list instanceof ColumnList) {
        return {
            gridTemplateColumns: `repeat(${list.children.length}, calc(100% / ${list.children.length}))`,
            gridTemplateRows: "100%",
        };
    } else {
        return {
            gridTemplateRows: `repeat(${list.children.length}, calc(100% / ${list.children.length}))`,
            gridTemplateColumns: "100%",
        };
    }
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

function jaggedBorder(color: string, panelColor: string, darkenPercent: number) {
    return {
        background: `-webkit-linear-gradient(${darken(panelColor, darkenPercent)} 0%, transparent 0%) 0 100% repeat-x,
                     -webkit-linear-gradient(135deg, ${color} 33.33%, transparent 33.33%) 0 0 / 15px 50px,
                     -webkit-linear-gradient(45deg, ${color} 33.33%, ${darken(panelColor, darkenPercent)} 33.33%) 0 0 / 15px 50px`,
    };
}

export const application = {
    ...cssVariables,
};

export const jobs = (isSessionFocused: boolean): CSSObject => ({
    ...(isSessionFocused ? {} : {pointerEvents: "none"}),
});

export const row: CSSProperties =  {
    minHeight: rowHeight,
};

export const suggestionIcon = {
    fontFamily: "FontAwesome",
    display: "inline-block",
    width: suggestionSize,
    height: suggestionSize,
    lineHeight: "2em",
    verticalAlign: "middle",
    textAlign: "center",
    fontStyle: "normal",
    opacity: .5,
    marginRight: 10,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
};

export const autocomplete = {
    box: (caretPosition: number): CSSProperties => {
        return {
            position: "absolute",
            top: "auto",
            bottom: suggestionSize + 8,
            left: decorationWidth + promptHorizontalPadding + (caretPosition * promptLetterWidth),
            minWidth: 300,
            boxShadow: defaultShadow,
            backgroundColor: colors.black,
            zIndex: 3,
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
    } as CSSProperties,
};

export const statusBar = {
    itself: {
        paddingTop: 12,
        paddingRight: 0,
        paddingBottom: 6,
        lineHeight: 1.3,
        backgroundColor: backgroundColor,
        display: "flex",
        flexDirection: "row-reverse",
        height: statusBarHeight,
    } as CSSProperties,
    presentDirectory: {
        flexGrow: 1,
        textOverflow: "ellipsis",
        direction: "rtl",
        textAlign: "left",
        overflow: "hidden",
        whiteSpace: "pre",
        paddingRight: "10px",
    } as CSSProperties,
    vcsData: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre",
        paddingRight: "8px",
    } as CSSProperties,
    icon: {fontFamily: "FontAwesome", paddingRight: 5, paddingLeft: 5, display: "inline-block", width: fontSize * 1.8, textAlign: "center"},
    rightSizeWrapper: {
    },
    stagedFileChanges: {color: colors.green},
    unstagedFileChanges: {color: colors.red},
    status: (status: VcsStatus) => {
        return {
            color: status === "dirty" ? colors.blue : colors.white,
        };
    },
};

export const sessions = (list: PaneList) => ({
    ...sessionsGridTemplate(list),
});

export const session = (isFocused: boolean) => {
    const styles: CSSObject = {};

    if (!isFocused) {
        styles.boxShadow = `0 0 0 1px ${alpha(colors.white, 0.3)}`;
        styles.margin = "0 1px 0 0";
    }

    return styles;
};

export const sessionShutter = (isFocused: boolean) => ({
    backgroundColor: colors.white,
    opacity: isFocused ? 0 : 0.2,
});

export const tabs = {
    justifyContent: "center" as "center",
    display: "flex",
    WebkitMarginBefore: 0,
    WebkitMarginAfter: 0,
    WebkitPaddingStart: 0,
    WebkitUserSelect: "none",
    listStyle: "none",
    paddingLeft: 68,
    paddingRight: 129,
};

const searchInputHeight = titleBarHeight - 6;
export const search: CSSProperties = {
    position: "absolute",
    right: 4,
    top: (titleBarHeight - searchInputHeight) / 2,
};

export const searchIcon: CSSProperties = {
    position: "relative",
    left: fontSize,
    top: -1,
    fontSize: fontSize - 4,
    fontFamily: "FontAwesome",
};

export const searchInput = {
    backgroundColor: searchInputColor,
    border: 0,
    borderRadius: 3,
    WebkitAppearance: "none",
    outline: "none",
    height: searchInputHeight,
    width: 120,
    paddingLeft: fontSize,
    color: colors.white,
};

export const tab = (isHovered: boolean, isFocused: boolean): CSSProperties => {
    return {
        backgroundColor: isHovered ? backgroundColor : colors.black,
        opacity: (isHovered || isFocused) ? 1 : 0.3,
        position: "relative",
        height: titleBarHeight,
        flex: "auto",
        display: "inline-block",
        textAlign: "center",
        paddingTop: 2,
    };
};

export const tabClose = (hover: TabHoverState): CSSProperties => {
    const margin = titleBarHeight - fontSize;

    return {
        fontFamily: "FontAwesome",
        color: tabCloseButtonColor(hover),
        position: "absolute",
        left: margin,
        top: margin / 2,
    };
};

export const commandSign = {
    fontSize: fontSize + 3,
    verticalAlign: "middle",
};

// To display even empty rows. The height might need tweaking.
// TODO: Remove if we always have a fixed output width.
export const charGroup = (attributes: Attributes) => {
    const styles: CSSObject = {
        display: "inline-block",
        height: rowHeight,
        color: colorValue(attributes.color, {isBright: attributes.brightness === Brightness.Bright}),
    };

    if (attributes.inverse) {
        const color = styles.color;

        styles.color = styles.backgroundColor;
        styles.backgroundColor = color;
    }

    if (attributes.underline) {
        styles.textDecoration = "underline";
    }

    if (attributes.weight === Weight.Bold) {
        styles.fontWeight = "bold";
    }

    if (attributes.cursor) {
        styles.backgroundColor = colors.white;
        styles.color = colors.black;
    }

    return styles;
};

export const outputCut = (status: Status, isHovered: boolean): CSSProperties => ({
    ...jaggedBorder(
        [Status.Failure, Status.Interrupted].includes(status) ? failurize(jobBackgroundColor) : jobBackgroundColor,
        [Status.Failure, Status.Interrupted].includes(status) ? failurize(backgroundColor) : backgroundColor,
        isHovered ? 0 : 0,
    ),
    position: "relative",
    top: -outputPadding,
    left: -outputPadding,
    width: "102%",
    height: outputCutHeight,
    textAlign: "center",
    paddingTop: (outputCutHeight - fontSize) / 3,
    color: lighten(jobBackgroundColor, isHovered ? 35 : 30),
    cursor: "pointer",
    zIndex: outputCutZIndex,
});

export const outputCutIcon = {marginRight: 10, fontFamily: "FontAwesome"};

export const output = (activeOutputType: OutputType, status: Status) => {
    const styles: CSSObject = {
        whiteSpace: "pre-wrap",
    };

    if (activeOutputType === OutputType.Alternate) {
        if ([Status.Failure, Status.Interrupted, Status.Success].includes(status)) {
            styles.zoom = 0.1;
        }

        if (status === Status.InProgress) {
            styles.backgroundColor = jobBackgroundColor;
            styles.position = "absolute";
            styles.top = 0;
            styles.bottom = 0;
            styles.left = 0;
            styles.right = 0;
            styles.zIndex = 4;
        }
    }

    return styles;
};

export const actions = {
    marginRight: 15,
    textAlign: "right",
};

export const action = {
    textAlign: "center",
    width: fontSize,
    display: "inline-block",
    margin: "0 3px",
    cursor: "pointer",
    fontFamily: "FontAwesome",
};

export const prettifyToggle = (isEnabled: boolean) => {
    return {
        ...action,
        color: isEnabled ? colors.green : colors.white,
    };
};

export const image = {
    maxHeight: "90vh",
    maxWidth: "100vh",
};
