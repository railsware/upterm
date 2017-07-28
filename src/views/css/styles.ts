import {Weight, Brightness, Color} from "../../Enums";
import {colors, colorValue} from "./colors";
import {darken, failurize, alpha, lighten} from "./functions";
import {Attributes} from "../../Interfaces";
import {CSSObject} from "./definitions";
import {PaneList} from "../../utils/PaneTree";
import {CSSProperties} from "react";

const jobBackgroundColor = colors.black;
const backgroundColor = darken(jobBackgroundColor, 4);
const fontFamily = "'Hack', 'Fira Code', 'Menlo', monospace";
const fontSize = 14;
const promptFontSize = fontSize * 1.1;
export const contentPadding = 10;
const suggestionSize = 2 * fontSize;
const promptLetterWidth = promptFontSize / 2 + 1.5;

function getLetterSize(size: number, fontFamily: string) {
    const height = size + 2;

    // document is not defined in tests.
    if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        context.font = `${size}px ${fontFamily}`;
        const metrics = context.measureText("m");
        return {width: metrics.width, height: height};
    } else {
        return {width: (size / 2) + 1.5, height: height};
    }
}

export const letterSize = getLetterSize(fontSize, fontFamily);

const decorationWidth = 30;

export const application = {
    "--font-size": `${fontSize}px`,
    "--font-family": fontFamily,
    "--row-height": `${letterSize.height}px`,
    "--content-padding": `${contentPadding}px`,
    "--search-input-color": lighten(backgroundColor, 15),
    "--background-color": backgroundColor,
    "--job-background-color": jobBackgroundColor,
    "--failed-job-background-color": failurize(jobBackgroundColor),
    "--text-color": colors.white,

    "--black-color": colors.black,
    "--red-color": colors.red,
    "--white-color": colors.white,
    "--green-color": colors.green,
    "--yellow-color": colors.yellow,
    "--blue-color": colors.blue,
    "--magenta-color": colors.magenta,
    "--cyan-color": colors.cyan,
};

export const jobs = (isSessionFocused: boolean): CSSObject => ({
    ...(isSessionFocused ? {} : {pointerEvents: "none"}),
});

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
            left: decorationWidth + (caretPosition * promptLetterWidth),
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
    suggestionsList: {
        maxHeight: 300,
        overflow: "auto",
        padding: 0,
        margin: 0,
    } as CSSProperties,
};

export const footer = {
    status: (status: VcsStatus) => ({
        color: status === "dirty" ? colors.blue : colors.white,
    }),
};

export const sessions = (list: PaneList) => ({
    gridTemplateColumns: `repeat(${list.children.length}, calc(100% / ${list.children.length}))`,
    gridTemplateRows: "100%",
});

export const pane = (isFocused: boolean) => {
    const styles: CSSObject = {};

    if (!isFocused) {
        styles.boxShadow = `0 0 0 1px ${alpha(colors.white, 0.3)}`;
        styles.margin = "0 1px 0 0";
    }

    return styles;
};

export const paneShutter = (isFocused: boolean) => ({
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

export const commandSign = {
    fontSize: fontSize + 3,
    verticalAlign: "middle",
};

// To display even empty rows. The height might need tweaking.
// TODO: Remove if we always have a fixed output width.
export const charGroup = (attributes: Attributes) => {
    const styles: CSSObject = {
        color: colorValue(attributes.color, {isBright: attributes.brightness === Brightness.Bright}),
        backgroundColor: colorValue(attributes.backgroundColor, {isBright: false}),
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

    // Remove default colors to allow CSS override for failed commands and reverse mode.
    if (attributes.color === Color.White && !attributes.inverse) {
        delete styles.color;
    }
    if (attributes.backgroundColor === Color.Black && !attributes.inverse) {
        delete styles.backgroundColor;
    }

    return styles;
};

export const cursor = (rowIndex: number, columnIndex: number, scrollbackSize: number) => ({
    top: rowIndex * letterSize.height + (scrollbackSize * letterSize.height),
    left: columnIndex * letterSize.width,
    height: letterSize.height,
    width: letterSize.width,
});

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
