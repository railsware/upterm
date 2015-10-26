import * as React from 'react';
import Buffer from "../Buffer";
import Char from "../Char";

interface Props {
    buffer: Buffer
}

export default class BufferComponent extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement('pre', {className: `output ${this.props.buffer.activeBuffer}`}, null,
            ...this.props.buffer.storage.map((row: Char[], index: number) => {
                // TODO: The or part should be removed.
                return this.props.buffer.renderRow(row || [], index, this.props.buffer.cursor);
            })
        );
    }
}
