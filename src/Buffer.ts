/// <reference path="references.ts" />

module BlackScreen {
    export class Buffer {
        buffer: Array<Array<Char>>;
        private cursor: Position;

        constructor(public dimensions: Dimensions) {
            this.buffer = Buffer.array2dOf(1, dimensions.columns, () => { return new Char(' '); });
            this.cursor = {row: 0, column: 0};
        }

        resize(dimensions: Dimensions): void {
            this.dimensions = dimensions;
            var newBuffer = Buffer.array2dOf(this.buffer.length, dimensions.columns, () => { return new Char(' '); });

            for (var row = 0; row != this.buffer.length; row++) {
                for (var column = 0; column != this.buffer[0].length; column++) {
                    if (row < dimensions.rows && column < dimensions.columns) {
                        newBuffer[row][column] = this.buffer[row][column];
                    }
                }
            }

            this.buffer = newBuffer;
        }

        static array2dOf(rows: number, columns: number, producer: any): Array<Array<Char>> {
            return Buffer.arrayOf(rows, () => {
                return Buffer.arrayOf(columns, producer);
            });
        }

        static arrayOf(n: number, producer: any): any {
            var array = new Array(n);

            for (var i = 0; i != n; i++) {
                array[i] = producer();
            }

            return array;
        }

        at(position: Position): Char {
            return this.buffer[position.row][position.column];
        }

        setAt(position: Position, element: Char): boolean {
            if (this.isWithinBoundaries(position)) {
                this.buffer[position.row][position.column] = element;
                return true;
            }

            return false;
        }

        write(element: Char): boolean {
            if (element.isNewLine()) {
                this.buffer.push(Buffer.arrayOf(this.buffer[0].length, () => { return new Char(' '); }));
                this.cursor = {row: this.cursor.row + 1, column: 0 }
            } else {
                if (this.setAt(this.cursor, element)) {
                    this.advanceCursor();
                    return true;
                }

                return false;
            }
        }

        moveCursor(position: Position): boolean {
            if (this.isWithinBoundaries(position)) {
                this.cursor = position;
                return true;
            }

            return false;
        }

        advanceCursor() {
            if (this.cursor.column + 1 < this.buffer[0].length) {
                this.moveCursor({column: this.cursor.column + 1, row: this.cursor.row});
            } else {
                if (this.cursor.row + 1 >= this.buffer.length){
                    this.buffer.push(Buffer.arrayOf(this.buffer[0].length, () => { return new Char(' '); }));
                }

                this.moveCursor({column: 0, row: this.cursor.row + 1});
            }
        }

        toString(): string {
            return this.buffer.map((row) => {
                return row.map((char) => {
                    return char.toString();
                }).join('')
            }).join('\n');
        }

        private isWithinBoundaries(position: Position): boolean {
            return position.row < this.buffer.length && position.column < this.buffer[0].length;
        }
    }
}
