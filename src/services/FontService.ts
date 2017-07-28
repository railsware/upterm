interface FontInfo {
    size: number;
    letterWidth: number;
    letterHeight: number;
    family: string;
}

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
    private static _instance: FontService;
    font: FontInfo;
    private listeners: Array<(font: FontInfo) => void> = [];

    static get instance() {
        if (!this._instance) {
            this._instance = new FontService();
        }

        return this._instance;
    }

    onChange(callback: (font: FontInfo) => void) {
        this.listeners.push(callback);
    }

    resetSize() {
        this.updateFont(fontSize, fontFamily);
        this.notifyListeners();
    }

    increaseSize() {
        this.updateFont(this.font.size + 1, fontFamily);
        this.notifyListeners();
    }

    decreaseSize() {
        this.updateFont(Math.max(4, this.font.size - 1), fontFamily);
        this.notifyListeners();
    }

    private constructor() {
        this.updateFont(fontSize, fontFamily);
    }

    private updateFont(size: number, family: string) {
        const letterSize = getLetterSize(size, family);

        this.font = {
            size: size,
            family: family,
            letterWidth: letterSize.width,
            letterHeight: letterSize.height,
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => {
            listener(this.font);
        });
    }
}
