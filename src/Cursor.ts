import * as i from './Interfaces';

export default class Cursor {
    private show = false;
    private blink = false;

    constructor(private position: i.Position = {row: 0, column: 0}) {
    }

    moveAbsolute(advancement: i.Advancement): Cursor {
        if (typeof advancement.horizontal != 'undefined') {
            this.position.column = advancement.horizontal;
        }

        if (typeof advancement.vertical != 'undefined') {
            this.position.row = advancement.vertical;
        }

        return this;
    }

    moveRelative(advancement: i.Advancement, dimensions?: i.Dimensions): Cursor {
        var vertical = Math.max(0, this.row() + (advancement.vertical || 0));
        var horizontal = Math.max(0, this.column() + (advancement.horizontal || 0));

        if (dimensions) {
            vertical = Math.min(dimensions.rows - 1, vertical);
            horizontal = Math.min(dimensions.columns - 1, horizontal);
        }

        this.moveAbsolute({ vertical: vertical, horizontal: horizontal });

        return this;
    }

    next(): void {
        this.moveRelative({horizontal: 1});
    }

    getPosition(): i.Position {
        return this.position;
    }

    column(): number {
        return this.position.column;
    }

    row(): number {
        return this.position.row;
    }

    getShow(): boolean {
        return this.show;
    }

    getBlink(): boolean {
        return this.blink;
    }

    setShow(state: boolean): void {
        this.show = state;
    }

    setBlink(state: boolean): void {
        this.blink = state;
    }
}
