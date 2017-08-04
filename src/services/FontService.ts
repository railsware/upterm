function getLetterSize(size: number, fontFamily: string) {
    const height = size + 2;

    // Not defined in tests.
    if (typeof document.createElement !== "undefined") {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        context.font = `${size}px ${fontFamily}`;
        const metrics = context.measureText("m");
        return {width: metrics.width, height: height};
    } else {
        return {width: (size / 2) + 1.5, height: height};
    }
}

const fontSize = 14;
const fontFamily = "'Hack', 'Fira Code', 'Menlo', monospace";

export class FontService {
    size: number;
    letterWidth: number;
    letterHeight: number;
    family: string;
    private listeners: Array<() => void> = [];

    constructor() {
        this.updateFont(fontSize, fontFamily);
    }

    onChange(callback: () => void) {
        this.listeners.push(callback);
    }

    resetSize() {
        this.updateFont(fontSize, fontFamily);
        this.notifyListeners();
    }

    increaseSize() {
        this.updateFont(this.size + 1, fontFamily);
        this.notifyListeners();
    }

    decreaseSize() {
        this.updateFont(Math.max(4, this.size - 1), fontFamily);
        this.notifyListeners();
    }

    private updateFont(size: number, family: string) {
        const letterSize = getLetterSize(size, family);

        this.size = size;
        this.family = family;
        this.letterWidth = letterSize.width;
        this.letterHeight = letterSize.height;
    }

    private notifyListeners() {
        this.listeners.forEach(listener => {
            listener();
        });
    }
}
