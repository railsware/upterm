const tinyColor: any = require("tinycolor2");

export function lighten(color: string, percent: number) {
    return tinyColor(color).lighten(percent).toHexString();
}

export function darken(color: string, percent: number) {
    return tinyColor(color).darken(percent).toHexString();
}

export function failurize(color: string) {
    return tinyColor(color).spin(140).saturate(20).toHexString();
}

export function toDOMString(pixels: number) {
    return `${pixels}px`;
}
