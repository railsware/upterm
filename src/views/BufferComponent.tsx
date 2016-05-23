import * as React from "react";
import Buffer from "../Buffer";
import Char from "../Char";
import {groupWhen} from "../utils/Common";
import {List} from "immutable";
import {getHTMLAttributes} from "./ViewUtils";
import {Attributes} from "../Interfaces";
import {Status} from "../Enums";
import {css, CSSObject} from "./css/main";

const CharGroupComponent = ({text, attributes}: {text: string, attributes: Attributes}) =>
    React.createElement("span", getHTMLAttributes(attributes), text);

const Cut = ({numberOfRows, clickHandler}: { numberOfRows: number, clickHandler: React.EventHandler<React.MouseEvent> }) =>
    <div className="output-cut" onClick={clickHandler}>{`Show all ${numberOfRows} rows.`}</div>;

interface RowProps {
    row: Immutable.List<Char>;
    style: CSSObject;
}

const charGrouper = (a: Char, b: Char) => a.attributes === b.attributes;

class RowComponent extends React.Component<RowProps, {}> {
    shouldComponentUpdate(nextProps: RowProps) {
        return this.props.row !== nextProps.row;
    }

    render() {
        let rowWithoutHoles = this.props.row.toArray().map(char => char || Char.empty);
        let charGroups = groupWhen(charGrouper, rowWithoutHoles).map((charGroup: Char[], index: number) =>
            <CharGroupComponent text={charGroup.map(char => char.toString()).join("")}
                                attributes={charGroup[0].attributes}
                                key={index}/>
        );

        return <div style={this.props.style} ref={(div: HTMLElement | undefined) => div && div.scrollIntoView()}>{charGroups}</div>;
    }
}

interface Props {
    buffer: Buffer;
    jobStatus: Status;
}

interface State {
    expandButtonPressed: boolean;
}

export default class BufferComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { expandButtonPressed: false };
    }

    render() {
        return (
            <pre className={`output ${this.props.buffer.activeBuffer}`}>
                {this.shouldCutOutput ? <Cut numberOfRows={this.props.buffer.size} clickHandler={() => this.setState({ expandButtonPressed: true })}/> : undefined}
                {this.renderableRows.map((row, index) => <RowComponent row={row || List<Char>()} key={index} style={css.row(this.props.jobStatus, this.props.buffer.activeBuffer)}/>)}
            </pre>
        );
    }

    private get shouldCutOutput(): boolean {
        return this.props.buffer.size > Buffer.hugeOutputThreshold && !this.state.expandButtonPressed;
    };

    private get renderableRows(): List<List<Char>> {
        return this.shouldCutOutput ? this.props.buffer.toCutRenderable() : this.props.buffer.toRenderable();
    }
}
