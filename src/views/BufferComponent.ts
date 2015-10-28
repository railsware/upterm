import * as React from 'react';
import * as i from '../Interfaces';
import * as e from '../Enums';
import Buffer from "../Buffer";
import Char from "../Char";
import Cursor from "../Cursor";
import {List} from 'immutable';

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
                row: row || List<Char>(),
                key: index
            }))
        );
    }
}

interface RowProps {
    row: Immutable.List<Char>;
}

class RowComponent extends React.Component<RowProps, {}> {
    shouldComponentUpdate(nextProps: RowProps) {
        return this.props.row !== nextProps.row;
    }
    render() {
        return React.createElement('div',
            {className: 'row'},
            this.props.row.map((char, index) => React.createElement(CharComponent, {
                char: char || Char.empty,
                key: index,
            }))
        );

    }
}

interface CharProps {
    char: Char;
}

class CharComponent extends React.Component<CharProps, {}> {
    shouldComponentUpdate(nextProps: CharProps) {
        return this.props.char !== nextProps.char;
    }
    render() {
        let attributes = this.props.char.getAttributes();

        return React.createElement('span', this.getHTMLAttributes(attributes), this.props.char.toString());
    }

    private getHTMLAttributes(attributes:i.Attributes):Object {
        var htmlAttributes:_.Dictionary<any> = {};
        _.each(attributes, (value, key) => {
            htmlAttributes[`data-${key}`] = value;
        });

        return htmlAttributes;
    }
}
