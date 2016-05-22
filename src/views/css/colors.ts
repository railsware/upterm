import {lighten, darken} from "./functions";

const baseColors = {
    black: "#292C33",
    red: "#BF6E7C",
    white: "#95A2BB",
    green: "#88B379",
    yellow: "#D9BD86",
    blue: "#66A5DF",
    magenta: "#C699C5",
    cyan: "#6EC6C6",
};

const brightColors = {
    brightBlack: "#484c54",
    brightRed: "#dd8494",
    brightWhite: "#adbcd7",
    brightGreen: "#9dcc8c",
    brightYellow: "#e9cc92",
    brightBlue: "#6cb2f0",
    brightMagenta: "#e8b6e7",
    brightCyan: "#7adada"
};

const extraColors = {
    selectionColor: `rgba(${lighten(baseColors.black, 20)}, 0.7)`,
};

function toRgb(colorComponent: number) {
    if (colorComponent === 0) {
        return 0;
    }
    
    return 55 + colorComponent * 40;
}


function generateIndexedColors() {
    const indexedColors: Dictionary<string>= {};

    for (let index = 0; index <= 215; ++index) {
        const red = Math.floor(index / 36);
        const green = Math.floor((index % 36) / 6);
        const blue = Math.floor(index % 6);

        const key = index + 16;

        indexedColors[key] = `rgb(${toRgb(red)}, ${toRgb(green)}, ${toRgb(blue)})`;
    }

    return indexedColors;
}

function generateGreyScaleColors() {
    const greyScaleColors: Dictionary<string> = {};

    for (let index = 0; index <= 23; ++index) {
        const color = index * 10 + 8;
        const key = index + 232;

        greyScaleColors[key] = `rgb(${toRgb(color)}, ${toRgb(color)}, ${toRgb(color)})`;
    }

    return greyScaleColors;
}

export const background = baseColors.black;
export const panel = darken(background, 3);

export const colors = Object.assign({}, brightColors, baseColors, extraColors, generateIndexedColors(), generateGreyScaleColors());
