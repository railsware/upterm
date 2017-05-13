interface IntersectionObserverEntry {
    readonly time: number;
    readonly rootBounds: ClientRect;
    readonly boundingClientRect: ClientRect;
    readonly intersectionRect: ClientRect;
    readonly intersectionRatio: number;
    readonly target: Element;
}

interface IntersectionObserverInit {
    // The root to use for intersection. If not provided, use the top-level document’s viewport.
    root?: Element;
    // Same as margin, can be 1, 2, 3 or 4 components, possibly negative lengths.  If an explicit
    // root element is specified, components may be percentages of the root element size.  If no
    // explicit root element is specified, using a percentage here is an error.
    // "5px"
    // "10% 20%"
    // "-10px 5px 5px"
    // "-10px -10px 5px 5px"
    rootMargin?: string;
    // Threshold(s) at which to trigger callback, specified as a ratio, or list of ratios,
    // of (visible area / total area) of the observed element (hence all entries must be
    // in the range [0, 1]).  Callback will be invoked when the visible ratio of the observed
    // element crosses a threshold in the list.
    threshold?: number | number[];
}

interface Window {
    DEBUG: boolean;
    search: any;
}

declare class AnsiParser {
    constructor(callbacks: Dictionary<Function>)

    parse(data: string): any;
}

interface Array<T> {
    includes(value: T): boolean;
}

interface NodeBuffer extends Uint8Array {
    fill(value: number, offset?: number, end?: number): this;
}

interface ObjectConstructor {
    assign<A, B, C, D, E, F>(a: A, b: B, c: C, d: D, e: E, f: F): A & B & C & D & E & F;
}

interface HTMLElement {
    scrollIntoViewIfNeeded(top?: boolean): void;
}
