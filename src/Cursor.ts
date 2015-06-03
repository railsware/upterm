import i = require('./Interfaces');

class Cursor {
    private show = false;
    private blink = false;

    constructor(private position: i.Position = {column: 0, row: 0}) {
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

    moveRelative(advancement: i.Advancement): Cursor {
        this.moveAbsolute({
            vertical: this.row() + (advancement.vertical || 0),
            horizontal: this.column() + (advancement.horizontal || 0)
        });

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

export = Cursor;
