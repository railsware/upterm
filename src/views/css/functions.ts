const tinyColor: any = require("tinycolor2");

export function lighten(color: string, percent: number) {
    return tinyColor(color).lighten(percent).toHexString();
}

export function darken(color: string, percent: number) {
    return tinyColor(color).darken(percent).toHexString();
}
