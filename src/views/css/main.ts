import {ScreenBufferType, Status, Weight, Brightness} from "../../Enums";
import {colors, panel as panelColor, background as backgroundColor, colorValue} from "./colors";
import {TabHoverState} from "../TabComponent";
import {darken, lighten, failurize, alpha} from "./functions";
import {Attributes} from "../../Interfaces";
import {suggestionsLimit} from "../../Autocompletion";
import {CSSObject, Px, Fr} from "./definitions";
import {ColumnList, PaneList} from "../../utils/PaneTree";

export {toDOMString} from "./functions";

const fontSize = 14;
export const outputPadding = 10;
const promptVerticalPadding = 5;
const promptHorizontalPadding = 10;
const promptHeight = 12 + (2 * promptVerticalPadding);
export const promptWrapperHeight = promptHeight + promptVerticalPadding;
const promptBackgroundColor = lighten(colors.black, 5);
const suggestionSize = 2 * fontSize;
const defaultShadow = "0 2px 8px 1px rgba(0, 0, 0, 0.3)";
export const titleBarHeight = 24;
export const rowHeight = fontSize + 4;
export const infoPanelHeight = 2 * fontSize + 4;
export const letterWidth = fontSize / 2 + 1.5;

const infoPanel = {
    paddingTop: 8,
    paddingRight: 0,
    paddingBottom: 6,
    paddingLeft: 0.6 * fontSize,
    lineHeight: 1.3,
    backgroundColor: panelColor,
};

const unfocusedJobs: CSSObject = {
    pointerEvents: "none",
};

const icon = {
    fontFamily: "FontAwesome",
};

const outputCutHeight = fontSize * 2.6;
const outputCutZIndex = 0;

const decorationWidth = 30;
const arrowZIndex = 2;
const progressBarStripesSize = 30;
const arrowColor = lighten(promptBackgroundColor, 10);
const searchInputColor = lighten(panelColor, 15);

const promptGrid = {
    decoration: {
        name: "decoration",
        width: new Px(decorationWidth),
    },
    prompt: {
        name: "prompt",
        width: new Fr(1),
    },
    actions: {
        name: "actions",
        width: new Px(150),
    },
};

const sessionsHeight = `(100vh - ${titleBarHeight + infoPanelHeight}px)`;

const applicationGrid = {
    container: {
        display: "grid",
        gridTemplateColumns: "100%",
        gridTemplateRows: `${titleBarHeight}px calc(${sessionsHeight}) ${infoPanelHeight}px`,
    },
    sessions: {
        height: "100%",
    },
};

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

const promptInlineElement: CSSObject = {
    paddingTop: 0,
    paddingRight: promptHorizontalPadding,
    paddingBottom: 3,
    paddingLeft: promptHorizontalPadding,
    gridArea: promptGrid.prompt.name,
    fontSize: fontSize,
    WebkitFontFeatureSettings: '"liga", "dlig"',
    whiteSpace: "pre-wrap",
    WebkitAppearance: "none",
    outline: "none",
};

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

export const application = Object.assign(
    {},
    applicationGrid.container,
    {
        backgroundColor: backgroundColor,
        color: colors.white,
        fontFamily: "'Hack', 'Fira Code', 'Menlo', monospace",
        fontSize: fontSize,
    }
);

export const jobs = (isSessionFocused: boolean): CSSObject =>
    isSessionFocused ? {} : unfocusedJobs;

export const row = (jobStatus: Status, activeScreenBufferType: ScreenBufferType) => {
    const style: CSSObject = {
        padding: `0 ${outputPadding}`,
        minHeight: rowHeight,
    };

    if (activeScreenBufferType === ScreenBufferType.Alternate) {
        if ([Status.Failure, Status.Interrupted, Status.Success].includes(jobStatus)) {
            style.height = 70;
        } else if (Status.InProgress === jobStatus) {
            style.margin = 0;
        }
    }

    return style;
};

export const autocompletionDescription = Object.assign(
    {
        display: "block",
        boxShadow: "0 4px 8px 1px rgba(0, 0, 0, 0.3)",
        position: "absolute",
        left: 0,
        right: 0,
        fontSize: "0.8em",
        minHeight: infoPanelHeight,
    },
    infoPanel
);

export const suggestionIcon = Object.assign(
    {},
    icon,
    {
        display: "inline-block",
        width: suggestionSize,
        height: suggestionSize,
        lineHeight: "2em",
        verticalAlign: "middle",
        textAlign: "center",
        fontStyle: "normal",
        opacity: ".5",
        marginRight: 10,
        backgroundColor: "rgba(0, 0, 0, 0.15)",
    }
);

export const autocomplete = {
    box: (offsetTop: number, caretPosition: number, hasDescription: boolean) => {
        const shouldDisplayAbove = offsetTop + (suggestionsLimit * suggestionSize) > window.innerHeight;

        return {
            position: "absolute",
            top: shouldDisplayAbove ? "auto" : promptWrapperHeight,
            bottom: shouldDisplayAbove ? suggestionSize + (hasDescription ? suggestionSize : 0) : "auto",
            left: decorationWidth + promptHorizontalPadding + (caretPosition * letterWidth),
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
    },
};

export const statusBar = {
    itself: infoPanel,
    presentDirectory: {
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
    },
};

export const sessions = (list: PaneList) => Object.assign(
    {
        backgroundColor: backgroundColor,
        display: "grid",
    },
    sessionsGridTemplate(list),
    applicationGrid.sessions
);

export const session = (isFocused: boolean) => {
    const styles: CSSObject = {
        position: "relative",
        outline: "none",
        overflowY: "scroll",
    };

    if (!isFocused) {
        styles.boxShadow = `0 0 0 1px ${alpha(colors.white, 0.3)}`;
        styles.margin = "0 1px 0 0";
    }

    return styles;
};

export const sessionShutter = (isFocused: boolean) => ({
    backgroundColor: colors.white,
    zIndex: 1,
    opacity: isFocused ? 0 : 0.2,
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
});

export const titleBar = {
    display: "flex",
    justifyContent: "center",
    WebkitAppRegion: "drag",
    WebkitMarginBefore: 0,
    WebkitMarginAfter: 0,
    WebkitPaddingStart: 0,
    WebkitUserSelect: "none",
};

const searchInputHeight = titleBarHeight - 6;
export const search = {
    position: "absolute",
    right: 4,
    top: (titleBarHeight - searchInputHeight) / 2,
};

export const searchIcon = Object.assign(
    {
        position: "relative",
        left: fontSize,
        top: -1,
        fontSize: fontSize - 4,
    },
    icon
);

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

export const tab = (isHovered: boolean, isFocused: boolean) => {
    return {
        backgroundColor: isHovered ? panelColor : colors.black,
        opacity: (isHovered || isFocused) ? 1 : 0.3,
        position: "relative",
        height: titleBarHeight,
        width: 150,
        display: "inline-block",
        textAlign: "center",
        paddingTop: 2,
    };
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
// TODO: Remove if we always have a fixed screenBuffer width.
export const charGroup = (attributes: Attributes, status: Status) => {
    const styles: CSSObject = {
        display: "inline-block",
        height: rowHeight,
        color: colorValue(attributes.color, {isBright: attributes.brightness === Brightness.Bright}),
        backgroundColor: [Status.Failure, Status.Interrupted].includes(status) ? failurize(backgroundColor) : colorValue(attributes.backgroundColor),
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

export const outputCut = (status: Status, isHovered: boolean) => Object.assign(
    {},
    jaggedBorder(
        [Status.Failure, Status.Interrupted].includes(status) ? failurize(backgroundColor) : backgroundColor,
        [Status.Failure, Status.Interrupted].includes(status) ? failurize(panelColor) : panelColor,
        isHovered ? 0 : 0
    ),
    {
        position: "relative",
        top: -outputPadding,
        left: -outputPadding,
        width: "102%",
        height: outputCutHeight,
        textAlign: "center",
        paddingTop: (outputCutHeight - fontSize) / 3,
        color: lighten(backgroundColor, isHovered ? 35 : 30),
        cursor: "pointer",
        zIndex: outputCutZIndex,
    }
);

export const outputCutIcon = Object.assign({marginRight: 10}, icon);

export const output = (activeScreenBufferType: ScreenBufferType, status: Status) => {
    const styles: CSSObject = {
        paddingTop: outputPadding,
        paddingBottom: outputPadding,
        paddingLeft: activeScreenBufferType === ScreenBufferType.Alternate ? 0 : outputPadding,
        paddingRight: activeScreenBufferType === ScreenBufferType.Alternate ? 0 : outputPadding,
        whiteSpace: "pre-wrap",
        backgroundColor: backgroundColor,
    };

    if (activeScreenBufferType === ScreenBufferType.Alternate) {
        if ([Status.Failure, Status.Interrupted, Status.Success].includes(status)) {
            styles.zoom = 0.1;
        }

        if (status === Status.InProgress) {
            styles.position = "absolute";
            styles.top = 0;
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

export const promptWrapper = (status: Status, isSticky: boolean) => {
    const styles: CSSObject = {
        top: 0,
        paddingTop: promptVerticalPadding,
        position: "relative", // To position the autocompletion box correctly.
        display: "grid",
        gridTemplateAreas: `'${promptGrid.decoration.name} ${promptGrid.prompt.name} ${promptGrid.actions.name}'`,
        gridTemplateRows: "auto",
        gridTemplateColumns: `${promptGrid.decoration.width.toCSS()} ${promptGrid.prompt.width.toCSS()} ${promptGrid.actions.width.toCSS()}`,
        backgroundColor: promptBackgroundColor,
        minHeight: promptWrapperHeight,
        zIndex: outputCutZIndex + 1,
    };

    if (isSticky) {
        styles.boxShadow = "0 5px 8px -3px rgba(0, 0, 0, 0.3)";
        styles.width = "100%";
        styles.position = "fixed";
        styles.top = titleBarHeight;
        styles.height = promptWrapperHeight;
    }

    if ([Status.Failure, Status.Interrupted].includes(status)) {
        styles.backgroundColor = failurize(promptBackgroundColor);
    }

    return styles;
};

export const arrow = (status: Status) => {
    const styles: CSSObject = {
        gridArea: promptGrid.decoration.name,
        position: "relative",
        width: decorationWidth,
        height: promptHeight - promptVerticalPadding,
        margin: "0 auto",
        overflow: "hidden",
        zIndex: arrowZIndex,
    };

    if (status === Status.InProgress) {
        styles.cursor = "progress";
    }

    return styles;
};

export const promptInfo = (status: Status) => {
    const styles: CSSObject = {
        cursor: "help",
        zIndex: 2,
        gridArea: promptGrid.decoration.name,
    };

    if (status === Status.Interrupted) {
        Object.assign(styles, icon);

        styles.position = "relative";
        styles.left = 6;
        styles.top = 1;
        styles.color = colors.black;
    }

    return styles;
};

export const actions = {
    gridArea: promptGrid.actions.name,
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
    );
};

export const autocompletedPreview = Object.assign(
    {},
    promptInlineElement,
    {
        color: lighten(promptBackgroundColor, 15),
    }
);

export const prompt = (isSticky: boolean) => Object.assign(
    {},
    promptInlineElement,
    {
        color: colors.white,
        zIndex: 2,
        whiteSpace: isSticky ? "nowrap" : "pre-wrap",
    }
);

export const promptPlaceholder = {
    minHeight: promptWrapperHeight,
};

export const arrowInner = (status: Status) => {
    const styles: CSSObject = {
        content: "",
        position: "absolute",
        width: "200%",
        height: "200%",
        top: -11,
        right: -8,
        backgroundColor: arrowColor,
        transformOrigin: "54% 0",
        transform: "rotate(45deg)",
        zIndex: arrowZIndex - 1,

        backgroundSize: 0, // Is used to animate the inProgress arrow.
    };

    if (status === Status.InProgress) {
        const color = lighten(colors.black, 3);

        styles.transition = "background 0.1s step-end 0.3s";
        styles.animation = "progress-bar-stripes 0.5s linear infinite";
        styles.backgroundImage = `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 50%, ${color} 50%, ${color} 75%, transparent 75%, transparent)`;
        styles.backgroundSize = `${progressBarStripesSize}px ${progressBarStripesSize}px`;
    }

    if ([Status.Failure, Status.Interrupted].includes(status)) {
        styles.backgroundColor = failurize(arrowColor);
    }

    return styles;
};

export const image = {
    maxHeight: "90vh",
    maxWidth: "100vh",
};
