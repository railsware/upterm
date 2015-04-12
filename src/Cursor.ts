/// <reference path="references.ts" />

module BlackScreen {
    export class Cursor {
        constructor(private position: Position = {column: 0, row: 0}) {
        }

        moveAbsolute(advancement: Advancement): Cursor {
            if (typeof advancement.horizontal != 'undefined') {
                this.position.column = advancement.horizontal;
            }

            if (typeof advancement.vertical != 'undefined') {
                this.position.row = advancement.vertical;
            }

            return this;
        }

        moveRelative(advancement: Advancement): Cursor {
            var vertical = this.row() + (advancement.vertical || 0);
            var horizontal = this.column() + (advancement.horizontal || 0);

            this.moveAbsolute({vertical: vertical, horizontal: horizontal});

            return this;
        }

        next(): void {
            this.moveRelative({horizontal: 1});
        }

        getPosition(): Position {
            return this.position;
        }

        column(): number {
            return this.position.column;
        }

        row(): number {
            return this.position.row;
        }
    }

    export interface Advancement {
        vertical?: number;
        horizontal?: number;
    }
}
