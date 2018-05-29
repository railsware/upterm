import {Subject} from "rxjs/Subject";

function getLetterSize(size: number, fontFamily: string) {
    const height = size + 2;

    if (process.env.NODE_ENV === "test") {

        return {width: (size / 2) + 1.5, height: height};
    } else {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        context.font = `${size}px ${fontFamily}`;
        const metrics = context.measureText("m");
        return {width: metrics.width, height: height};
    }
}

const fontSize = 16;
const fontFamily = "'Ubuntu Mono', 'Fira Code', 'Menlo', monospace";

export class FontService {
    size: number;
    letterWidth: number;
    letterHeight: number;
    family: string;
    readonly onChange = new Subject<void>();

    constructor() {
        this.updateFont(fontSize, fontFamily);
    }

    resetSize() {
        this.updateFont(fontSize, fontFamily);
        this.onChange.next();
    }

    increaseSize() {
        this.updateFont(this.size + 1, fontFamily);
        this.onChange.next();
    }

    decreaseSize() {
        this.updateFont(Math.max(4, this.size - 1), fontFamily);
        this.onChange.next();
    }

    private updateFont(size: number, family: string) {
        const letterSize = getLetterSize(size, family);

        this.size = size;
        this.family = family;
        this.letterWidth = letterSize.width;
        this.letterHeight = letterSize.height;
    }
}
