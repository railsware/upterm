import * as React from "react";
import * as _ from "lodash";
import {Output} from "../Output";
import {Char, createChar, space} from "../Char";
import {groupWhen} from "../utils/Common";
import {List} from "immutable";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {Job} from "../shell/Job";
import {Status} from "../Enums";

const CharGroupComponent = ({job, group}: {job: Job, group: Char[]}) =>
    <span style={css.charGroup(group[0].attributes, job.status)}>{group.map(char => char.value).join("")}</span>;

interface CutProps {
    job: Job;
    clickHandler: React.EventHandler<React.MouseEvent<HTMLDivElement>>;
}

interface CutState {
    isHovered: boolean;
}

class Cut extends React.Component<CutProps, CutState> {
    constructor() {
        super();
        this.state = {isHovered: false};
    }

    render() {
        return (
            <div style={css.outputCut(this.props.job.status, this.state.isHovered)}
                 onClick={this.props.clickHandler}
                 onMouseEnter={() => this.setState({isHovered: true})}
                 onMouseLeave={() => this.setState({isHovered: false})}>
                <i style={css.outputCutIcon}>{fontAwesome.expand}</i>
                {`Show all ${this.props.job.output.size} rows.`}
            </div>
        );
    }
}
interface RowProps {
    row: List<Char>;
    hasCursor: boolean;
    status: Status;
    job: Job;
}

const charGrouper = (a: Char, b: Char) => a.attributes === b.attributes;

class RowComponent extends React.Component<RowProps, {}> {
    shouldComponentUpdate(nextProps: RowProps) {
        return this.props.row !== nextProps.row ||
            this.props.status !== nextProps.status ||
            this.props.hasCursor !== nextProps.hasCursor;
    }

    render() {
        const cursorColumnIndex = this.props.job.output.cursorColumnIndex;
        const row = this.props.row.toArray();

        const rowWithoutHoles = _.range(0, Math.max(cursorColumnIndex + 1, this.props.row.size)).map(index => {
            const char = row[index] || space;
            const attributes = (this.props.hasCursor && index === cursorColumnIndex) ?
                {...char.attributes, cursor: true} :
                char.attributes;

            return createChar(char.value, attributes);
        });

        const charGroups = groupWhen(charGrouper, rowWithoutHoles).map((charGroup: Char[], index: number) =>
            <CharGroupComponent job={this.props.job} group={charGroup} key={index}/>,
        );

        return <div className="output-row"
                    style={css.row(this.props.job.status, this.props.job.output.activeOutputType)}
                    ref={(div: HTMLElement | undefined) => div && div.scrollIntoViewIfNeeded()}>{charGroups}</div>;
    }
}

interface Props {
    job: Job;
}

interface State {
    expandButtonPressed: boolean;
}

export class OutputComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { expandButtonPressed: false };
    }

    render() {
        const output = this.props.job.output;
        const showCursor = this.props.job.status === Status.InProgress && (output._showCursor || output._blinkCursor);

        return (
            <div className="output"
                 style={css.output(this.props.job.output.activeOutputType, this.props.job.status)}>
                {this.shouldCutOutput ? <Cut job={this.props.job} clickHandler={() => this.setState({ expandButtonPressed: true })}/> : undefined}
                {output.storage.map((possiblyEmptyRow, index: number) => {
                    const row = possiblyEmptyRow || List<Char>();

                    if (this.shouldCutOutput && index < output.size - Output.hugeOutputThreshold) {
                        return undefined;
                    } else {
                        return (
                            <RowComponent
                                key={index}
                                row={row}
                                hasCursor={index === output.cursorRowIndex && showCursor}
                                status={this.props.job.status}
                                job={this.props.job}/>
                        );
                    }
                })}
            </div>
        );
    }

    private get shouldCutOutput(): boolean {
        return this.props.job.output.size > Output.hugeOutputThreshold && !this.state.expandButtonPressed;
    }
}
