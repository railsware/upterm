/// <reference path="references.ts" />

module BlackScreen {
    export class Buffer extends EventEmitter {
        buffer: Array<Array<Char>>;
        private cursor: Cursor;

        constructor() {
            super();

            this.buffer = [];
            this.cursor = new Cursor();
        }

        write(char: Char): void {
            if (char.isSpecial()) {
                switch (char.getCharCode()) {
                    case CharCode.NewLine:
                        this.cursor.moveRelative({vertical: 1});
                        this.cursor.moveAbsolute({horizontal: 0});
                        break;
                    default:
                        console.error(`Couldn't write a special char ${char}`);
                }
            } else {
                this.set(this.cursor.getPosition(), char);
                this.cursor.next();
            }
            this.emit('change', this.toString, char);
        }

        private set(position: Position, char: Char): void {
            if (typeof this.buffer[position.row] == 'undefined') {
                this.buffer[position.row] = []
            }
            this.buffer[position.row][position.column] = char;
        }

        toString(): string {
            return this.buffer.map((row) => {
                return row.map((char) => {
                    return char.toString();
                }).join('')
            }).join('\n');
        }
    }
}
