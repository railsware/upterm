import * as React from "react";
import {ScreenBuffer} from "../ScreenBuffer";
import {Char} from "../Char";
import {groupWhen} from "../utils/Common";
import {List} from "immutable";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {Job} from "../shell/Job";
import {Status} from "../Enums";

const CharGroupComponent = ({job, group}: {job: Job, group: Char[]}) =>
    <span style={css.charGroup(group[0].attributes, job.status)}>{group.map(char => char.toString()).join("")}</span>;

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
                {`Show all ${this.props.job.screenBuffer.size} rows.`}
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
        const rowWithoutHoles = this.props.row.toArray().map((char, index) => {
            const char2 = char || Char.empty;
            const attributes = (this.props.hasCursor && index === this.props.job.screenBuffer.cursorColumn) ?
                {...char2.attributes, cursor: true} :
                char2.attributes;

            return Char.flyweight(char2.toString(), attributes);

        });

        const charGroups = groupWhen(charGrouper, rowWithoutHoles).map((charGroup: Char[], index: number) =>
            <CharGroupComponent job={this.props.job} group={charGroup} key={index}/>,
        );

        return <div className="output-row"
                    style={css.row(this.props.job.status, this.props.job.screenBuffer.activeScreenBufferType)}
                    ref={(div: HTMLElement | undefined) => div && div.scrollIntoViewIfNeeded()}>{charGroups}</div>;
    }
}

interface Props {
    job: Job;
}

interface State {
    expandButtonPressed: boolean;
}

export class BufferComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { expandButtonPressed: false };
    }

    render() {
        const buffer = this.props.job.screenBuffer;

        return (
            <div className="output"
                 style={css.output(this.props.job.screenBuffer.activeScreenBufferType, this.props.job.status)}>
                {this.shouldCutOutput ? <Cut job={this.props.job} clickHandler={() => this.setState({ expandButtonPressed: true })}/> : undefined}
                {this.renderableRows.map((row, index: number) =>
                    <RowComponent
                        key={index}
                        row={row || List<Char>()}
                        hasCursor={index === buffer.cursorRow && this.props.job.status === Status.InProgress && (buffer._showCursor || buffer._blinkCursor)}
                        status={this.props.job.status}
                        job={this.props.job}/>,
                )}
            </div>
        );
    }

    private get shouldCutOutput(): boolean {
        return this.props.job.screenBuffer.size > ScreenBuffer.hugeOutputThreshold && !this.state.expandButtonPressed;
    }

    private get renderableRows(): List<List<Char>> {
        return this.shouldCutOutput ? this.props.job.screenBuffer.toCutRenderable() : this.props.job.screenBuffer.toRenderable();
    }
}
