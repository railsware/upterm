import * as React from "react";
import {Char} from "../Char";
import {groupWhen} from "../utils/Common";
import {List} from "immutable";
import * as css from "./css/styles";
import {Job} from "../shell/Job";
import {Status} from "../Enums";

const CharGroupComponent = ({group}: {group: Char[]}) => {
    const attributes = group[0].attributes;
    return (
        <span
            className="char-group"
            style={attributes ? css.charGroup(attributes) : null}>
        {group.map(char => char.value).join("")}
        </span>
    );
};

interface RowProps {
    row: List<Char>;
}

export class RowComponent extends React.Component<RowProps, {}> {
    shouldComponentUpdate(nextProps: RowProps) {
        return this.props.row !== nextProps.row;
    }

    render() {
        const charGroups = groupWhen((a, b) => a.attributes === b.attributes, this.props.row.toArray());
        const charGroupComponents = charGroups.map((charGroup: Char[], index: number) =>
            <CharGroupComponent group={charGroup} key={index}/>,
        );

        return (
            <div className="row">
                {charGroupComponents}
            </div>
        );
    }
}

interface Props {
    job: Job;
}

export class OutputComponent extends React.Component<Props, {}> {
    componentDidMount() {
        this.props.job.once("data", () => this.forceUpdate());
    }

    componentDidUpdate() {
        this.props.job.once("data", () => this.forceUpdate());
    }

    render() {
        const output = this.props.job.output;
        const buffer = output.activeBuffer;
        const showCursor = this.props.job.status === Status.InProgress && (buffer._showCursor || buffer._blinkCursor);
        const cursorComponent = showCursor
            ? <span className="cursor"
                    style={{
                        "--scrollback-size": buffer.scrollbackSize,
                        "--row-index": buffer.cursorRowIndex,
                        "--column-index": buffer.cursorColumnIndex,
                    }}/>
            : undefined;

        const rowComponents = buffer.map(row => <RowComponent key={row.hashCode()} row={row}/>);

        return (
            <div className="output"
                 data-screen-mode={output.screenMode}
                 data-buffer-type={output.activeBufferType}>
                {cursorComponent}
                {rowComponents}
            </div>
        );
    }
}
