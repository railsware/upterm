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

export default class BufferComponent extends React.Component<Props, {}> {
    render() {
        return React.createElement(
            "pre",
            { className: `output ${this.props.buffer.activeBuffer}` },
            this.props.buffer.toArray().map((row, index) => React.createElement(
                RowComponent,
                {
                    row: row || List<Char>(),
                    key: index,
                }
            ))
        );
    }

    componentDidUpdate() {
        if (this.props.buffer.activeBuffer === e.Buffer.Standard) {
            scrollToBottom();
        }
    }
}

interface RowProps {
    row: Immutable.List<Char>;
    key: number;
}

const charGrouper = (a: any, b: any) => JSON.stringify(a.getAttributes()) === JSON.stringify(b.getAttributes());


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
            charGroups.map((charGroup: Char[], index: number) => React.createElement(CharGroupComponent, {
                text: charGroup.map(char => char.toString()).join(""),
                attributes: charGroup[0].getAttributes(),
                key: index,
            }))
        );

    }
}

interface CharGroupProps {
    text: string;
    attributes: i.Attributes;
    key: number;
}

class CharGroupComponent extends React.Component<CharGroupProps, {}> {
    shouldComponentUpdate(nextProps: CharGroupProps) {
        return JSON.stringify(this.props) !== JSON.stringify(nextProps);
    }

    render() {
        return React.createElement("span", this.getHTMLAttributes(this.props.attributes), this.props.text);
    }

    private getHTMLAttributes(attributes: i.Attributes): Object {
        let htmlAttributes: _.Dictionary<any> = {};
        _.each(<_.Dictionary<any>>attributes, (value, key) => {
            htmlAttributes[`data-${key}`] = value;
        });

        return htmlAttributes;
    }
}
