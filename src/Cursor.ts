/// <reference path="references.ts" />

module BlackScreen {
    export class Cursor {
        constructor(private position: Position = {column: 0, row: 0}) {
        }

        moveAbsolute(advancement: Advancement): void {
            if (advancement.horizontal) {
                this.position.column = advancement.horizontal;
            }

            if (advancement.vertical) {
                this.position.row = advancement.vertical;
            }
        }

        moveRelative(advancement: Advancement): void {
            var vertical = this.row() + (advancement.vertical || 0);
            var horizontal = this.column() + (advancement.horizontal || 0);

            this.moveAbsolute({vertical: vertical, horizontal: horizontal});
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
