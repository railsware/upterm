import * as React from "react";
import Buffer from "../Buffer";
import Char from "../Char";
import {groupWhen} from "../utils/Common";
import {List} from "immutable";
import {Attributes} from "../Interfaces";
import {css, CSSObject} from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import Job from "../Job";

const CharGroupComponent = ({text, attributes}: {text: string, attributes: Attributes}) =>
    <span style={css.charGroup(attributes)}>{text}</span>;

interface CutProps {
    numberOfRows: number;
    clickHandler: React.EventHandler<React.MouseEvent>;
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
            <div style={css.outputCut(this.state.isHovered)}
                 onClick={this.props.clickHandler}
                 onMouseEnter={() => this.setState({isHovered: true})}
                 onMouseLeave={() => this.setState({isHovered: false})}>
                <i style={css.outputCutIcon} dangerouslySetInnerHTML={{__html: fontAwesome.expand}}/>
                {`Show all ${this.props.numberOfRows} rows.`}
            </div>
        );
    }
}
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
    job: Job;
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
            <div className="output"
                 style={css.output(this.props.job.buffer.activeBuffer, this.props.job.status)}>
                {this.shouldCutOutput ? <Cut numberOfRows={this.props.job.buffer.size} clickHandler={() => this.setState({ expandButtonPressed: true })}/> : undefined}
                {this.renderableRows.map((row, index) => <RowComponent row={row || List<Char>()} key={index} style={css.row(this.props.job.status, this.props.job.buffer.activeBuffer)}/>)}
            </div>
        );
    }

    private get shouldCutOutput(): boolean {
        return this.props.job.buffer.size > Buffer.hugeOutputThreshold && !this.state.expandButtonPressed;
    };

    private get renderableRows(): List<List<Char>> {
        return this.shouldCutOutput ? this.props.job.buffer.toCutRenderable() : this.props.job.buffer.toRenderable();
    }
}
