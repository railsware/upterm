import * as React from 'react';
import * as i from '../Interfaces';
import * as e from '../Enums';
import Buffer from "../Buffer";
import Char from "../Char";
import Cursor from "../Cursor";

interface Props {
    buffer: Buffer
}

export default class BufferComponent extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement('pre', {className: `output ${this.props.buffer.activeBuffer}`},
            this.props.buffer.toArray().map((row, index) => React.createElement(RowComponent, {
                row: row,
                index: index,
                key: index,
                hasCursor: this.props.buffer.cursorPosition.row === index,
                cursorColumn: this.props.buffer.cursorPosition.column
            }))
        );
    }
}

interface RowProps {
    row: Immutable.List<Char>;
    index: number;
    hasCursor: boolean;
    cursorColumn: number;
}

class RowComponent extends React.Component<RowProps, {}> {
    shouldComponentUpdate(nextProps: RowProps) {
        return this.props.hasCursor || nextProps.hasCursor || this.props.row !== nextProps.row;
    }
    render() {
        return React.createElement('div',
            {className: 'row'},
            this.props.row.map((char, index) => React.createElement(CharComponent, {
                char: char || Char.flyweight(' ', {}), // TODO: Figure out why there is no char sometimes. To reproduce start vim and press i.
                key: index,
                hasCursor: this.props.hasCursor && this.props.cursorColumn === index
            }))
        );

    }
}

interface CharProps {
    char: Char;
    hasCursor: boolean;
}

class CharComponent extends React.Component<CharProps, {}> {
    shouldComponentUpdate(nextProps: CharProps) {
        return this.props.char !== nextProps.char || this.props.hasCursor !== nextProps.hasCursor;
    }
    render() {
        let attributes = this.props.char.getAttributes();

        if (this.props.hasCursor) {
            attributes['background-color'] = e.Color.White;
            attributes.color = e.Color.Black;
        }

        return React.createElement(
            'span',
            this.getHTMLAttributes(attributes),
            this.props.char.toString()
        );
    }

    private getHTMLAttributes(attributes:i.Attributes):Object {
        var htmlAttributes:_.Dictionary<any> = {};
        _.each(attributes, (value, key) => {
            htmlAttributes[`data-${key}`] = value;
        });

        return htmlAttributes;
    }
}
