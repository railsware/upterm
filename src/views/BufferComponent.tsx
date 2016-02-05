import * as React from "react";
import * as i from "../Interfaces";
import * as e from "../Enums";
import * as _ from "lodash";
import Buffer from "../Buffer";
import Char from "../Char";
import {groupWhen} from "../Utils";
import {List} from "immutable";
import {scrollToBottom} from "./ViewUtils";

interface Props {
    buffer: Buffer;
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
                {this.shouldCutOutput ? this.cutChild : undefined}
                {this.renderableRows.map((row, index) => <RowComponent row={row || List<Char>()} key={index}/>)}
            </pre>
        );
    }

    componentDidUpdate() {
        if (this.props.buffer.activeBuffer === e.Buffer.Standard) {
            scrollToBottom();
        }
    }

    private get shouldCutOutput(): boolean {
        return this.props.buffer.size > Buffer.hugeOutputThreshold && !this.state.expandButtonPressed;
    };

    private get renderableRows(): List<List<Char>> {
        return this.shouldCutOutput ? this.props.buffer.toCutRenderable() : this.props.buffer.toRenderable();
    }

    private get cutChild(): React.ReactElement<CutProps> {
        return React.createElement(
            Cut,
            {
                numberOfRows: this.props.buffer.size,
                clickHandler: () => this.setState({ expandButtonPressed: true }),
            }
        );
    }
}

interface RowProps {
    row: Immutable.List<Char>;
}

const charGrouper = (a: Char, b: Char) => a.attributes === b.attributes;


class RowComponent extends React.Component<RowProps, {}> {
    shouldComponentUpdate(nextProps: RowProps) {
        return this.props.row !== nextProps.row;
    }

    render() {
        let rowWithoutHoles = this.props.row.toArray().map(char => char || Char.empty);
        let charGroups: Char[][] = groupWhen(charGrouper, rowWithoutHoles);

        return React.createElement(
            "div",
            { className: "row" },
            charGroups.map((charGroup: Char[], index: number) =>
                <CharGroupComponent text={charGroup.map(char => char.toString()).join("")}
                                    attributes={charGroup[0].attributes}
                                    key={index}/>
            )
        );

    }
}

interface CharGroupProps {
    text: string;
    attributes: i.Attributes;
}

class CharGroupComponent extends React.Component<CharGroupProps, {}> {
    shouldComponentUpdate(nextProps: CharGroupProps) {
        return JSON.stringify(this.props) !== JSON.stringify(nextProps);
    }

    render() {
        return React.createElement("span", this.getHTMLAttributes(this.props.attributes), this.props.text);
    }

    private getHTMLAttributes(attributes: i.Attributes): Object {
        let htmlAttributes: Dictionary<any> = {};
        _.each(attributes, (value, key) => {
            htmlAttributes[`data-${key}`] = value;
        });

        return htmlAttributes;
    }
}

interface CutProps {
    numberOfRows: number;
    clickHandler: Function;
}

class Cut extends React.Component<CutProps, {}> {
    shouldComponentUpdate(nextProps: CutProps) {
        return this.props.numberOfRows !== nextProps.numberOfRows;
    }

    render() {
        return React.createElement(
            "div",
            { className: "output-cut", onClick: this.props.clickHandler },
            `Show all ${this.props.numberOfRows} rows.`
        );
    }
}
