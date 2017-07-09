type BorderType = number | string;

export interface CSSObject {
    contain?: "strict" | "paint";
    pointerEvents?: string;
    marginTop?: number;
    marginBottom?: number;
    borderTop?: BorderType;
    borderLeft?: BorderType;
    borderRight?: BorderType;
    borderBottom?: BorderType;
    padding?: string | number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    minHeight?: number | string;
    minWidth?: number | string;
    height?: number | string;
    margin?: number | string;
    listStyleType?: "none";
    backgroundColor?: string;
    cursor?: "pointer" | "help" | "progress";
    color?: string;
    width?: string | number;
    flex?: number | "auto" | "none";
    flexGrow?: number;
    flexBasis?: number;
    flexDirection?: "row" | "column" | "column-reverse";
    overflow?: "hidden";
    overflowX?: "auto" | "scroll";
    overflowY?: "auto" | "scroll" | "hidden";
    gridRow?: string;
    gridColumn?: string;
    outline?: "none";
    opacity?: number;
    boxShadow?: string;
    zoom?: number;
    position?: "fixed" | "relative" | "absolute";
    top?: number | "auto";
    bottom?: number | "auto";
    left?: number;
    right?: number;
    whiteSpace?: "pre-wrap" | "nowrap";
    zIndex?: number;
    gridArea?: string;
    display?: "grid" | "inline-block" | "flex";
    gridTemplateAreas?: string;
    gridTemplateRows?: "auto" | string;
    gridTemplateColumns?: string;
    transition?: string;
    animation?: string;
    backgroundImage?: string;
    backgroundSize?: string | number;
    backgroundRepeat?: string;
    backgroundPosition?: string;
    content?: string;
    transformOrigin?: string;
    transform?: string;
    textDecoration?: "underline";
    fontWeight?: "bold";
    fontSize?: number | string;
    fontFamily?: string;
    WebkitAppearance?: "none";
}

abstract class Unit {
    abstract toCSS(): string;
}

export class Px extends Unit {
    constructor(private number: number) {
        super();
    }

    toCSS(): string {
        return `${this.number}px`;
    }
}

export class Fr extends Unit {
    constructor(private number: number) {
        super();
    }

    toCSS(): string {
        return `${this.number}fr`;
    }
}
