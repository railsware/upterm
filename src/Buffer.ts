/// <reference path="references.ts" />

module BlackScreen {
    export class Buffer extends EventEmitter {
        private storage: Array<Array<Char>>;
        private cursor: Cursor;

        constructor() {
            super();

            this.storage = [];
            this.cursor = new Cursor();
        }

        write(char: Char): void {
            if (char.isSpecial()) {
                switch (char.getCharCode()) {
                    case CharCode.NewLine:
                        this.cursor.moveRelative({vertical: 1});
                        this.cursor.moveAbsolute({horizontal: 0});
                        break;
                    case CharCode.CarriageReturn:
                        this.cursor.moveAbsolute({horizontal: 0});
                        break;
                    default:
                        console.error(`Couldn't write a special char ${char}`);
                }
            } else {
                this.set(this.cursor.getPosition(), char);
                this.cursor.next();
            }

            this.emit('data');
        }

        toString(): string {
            return this.storage.map((row) => {
                return row.map((char) => {
                    return char.toString();
                }).join('')
            }).join('\n');
        }

        map<R>(callback: (row: Array<Char>, index: number) => R): Array<R> {
            return this.storage.map(callback);
        }

        private set(position: Position, char: Char): void {
            if (!this.hasRow(position.row)) {
                this.addRow(position.row);
            }

            this.storage[position.row][position.column] = char;
        }

        private addRow(row: number): void {
            this.storage[row] = []
        }

        private hasRow(row: number): boolean {
            return typeof this.storage[row] == 'object';
        }
    }
}
