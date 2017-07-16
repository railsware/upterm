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
            data-color={attributes.color}
            data-background-color={attributes.backgroundColor}
            data-brightness={attributes.brightness}
            data-weight={attributes.weight}
            data-underline={attributes.underline}
            data-crossed-out={attributes.crossedOut}
            data-blinking={attributes.blinking}
            data-cursor={attributes.cursor}
            data-inverse={attributes.inverse}
            style={css.charGroup(attributes)}>
        {group.map(char => char.value).join("")}
        </span>
    );
};

interface RowProps {
    index: number;
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
            <div className="row" data-index={this.props.index} ref={(div: HTMLDivElement | null) => div && div.scrollIntoViewIfNeeded()}>
                {charGroupComponents}
            </div>
        );
    }
}

interface Props {
    job: Job;
}

export class OutputComponent extends React.Component<Props, {}> {
    render() {
        const output = this.props.job.output;
        const showCursor = this.props.job.status === Status.InProgress && (output._showCursor || output._blinkCursor);
        const cursorComponent = showCursor ? <span className="cursor" data-row-index={output.cursorRowIndex} style={css.cursor(output.cursorRowIndex, output.cursorColumnIndex, output.scrollbackSize)}/> : undefined;

        const rowComponents = output.map((row, index) => <RowComponent key={index} index={index} row={row}/>);

        return (
            <div className="output"
                 data-screen-mode={output.screenMode}
                 style={css.output(output.activeOutputType, this.props.job.status)}>
                {cursorComponent}
                {rowComponents}
            </div>
        );
    }
}
