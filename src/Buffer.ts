/// <reference path="references.ts" />

module BlackScreen {
    export class Buffer extends EventEmitter {
        private storage: Array<Array<Char>> = [];
        public cursor: Cursor = new Cursor();
        private attributes: Attributes = {color: Color.White, weight: Weight.Normal};

        constructor() {
            super();
        }

        write(raw: string): void {
            var char = new Char(raw, _.clone(this.attributes));

            if (char.isSpecial()) {
                switch (char.getCharCode()) {
                    case CharCode.NewLine:
                        this.cursor.moveRelative({vertical: 1}).moveAbsolute({horizontal: 0});
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

        setAttributes(attributes: Attributes): void {
            this.attributes = _.merge(this.attributes, attributes);
        }

        toString(): string {
            return this.toLines().join('\n');
        }

        toLines(): Array<string> {
            return this.storage.map((row) => {
                return row.map((char) => {
                    return char.toString();
                }).join('')
            });
        }

        map<R>(callback: (row: Array<Char>, index: number) => R): Array<R> {
            return this.storage.map(callback);
        }

        render() {
            return React.createElement('pre', {className: 'output'}, null, ...this.storage.map(this.renderRow, this));
        }

        clear() {
            this.storage = [];
        }

        isEmpty(): boolean {
            return this.storage.length === 0;
        }

        private renderRow(row: Array<Char>, index: number) {

            var consecutive: Array<any> = [];
            var current = {attributes: <Attributes>null, text: '' };

            row.forEach((element: Char) => {
                var attributes = element.getAttributes();
                var value = element.toString();

                if (_.isEqual(attributes, current.attributes)) {
                    current.text += value;
                    current.attributes = attributes;
                } else {
                    consecutive.push(current);
                    current = {attributes: attributes, text: value};
                }
            });

            consecutive.push(current);

            var children = consecutive.map((group, groupIndex) => {
                return React.createElement(
                    'span',
                    _.merge(this.getHTMLAttributes(group.attributes), { key: `group-${groupIndex}` }),
                    group.text
                );
            });

            return React.createElement('div', {className: 'row', key: `row-${index}`}, null, ...children);
        }


        private getHTMLAttributes(attributes: Attributes): Object {
            var htmlAttributes: { [indexer: string]: any } = {};
            _.each(attributes, (value, key) => { htmlAttributes[`data-${key}`] = value; });

            return htmlAttributes;
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
