import * as React from "React";
import {PluginManager} from "../PluginManager";
import {Job} from "../shell/Job";
import {join, isAbsolute} from "path";
import {dirStat} from "dirStat";
import * as e from "electron";
import {CSSObject} from "../views/css/definitions";
import {isEqual} from "lodash";
import {colors} from "../views/css/colors";

type Props = {
    path: string,
}

type State = {
    success: boolean | undefined,
    dirStat: any,
    itemWidth: number | undefined,
}

const renderFile = (file: any, itemWidth = 0) => {
    const style: CSSObject = {display: "inline-block"};
    if (itemWidth) {
        // TODO: respect LSCOLORS env var
        style.width = `${itemWidth}px`;
        style.cursor = "pointer";
        style.margin = "2px 4px";
    }
    return <span
        style={style}
        onClick={() => e.shell.openExternal(`file://${file.filePath}`)}>
        <span className="underlineOnHover" style={{color: file.isDirectory() ? colors.blue : colors.white}}>{file.fileName}</span>
        <span>{file.isDirectory() ? "/" : ""}</span>
    </span>;
};

class LSComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            dirStat: undefined,
            success: undefined,
            itemWidth: undefined,
        };

        dirStat(props.path, (err, results) => {
            if (err) {
                this.setState({ success: false } as State);
            } else {
                this.setState({
                    success: true,
                    dirStat: results,
                } as State);
            }
        });
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return !(isEqual(this.props, nextProps) && isEqual(this.state, nextState));
    }

    render() {
        if (this.state.success === false) {
            return <div>Failed</div>;
        } else if (this.state.success === true) {
            return <div
                style={{padding: "10px"}}
                ref={element => {
                    if (element) {
                        const children = Array.prototype.slice.call(element.children);
                        this.setState({
                            itemWidth: Math.max(...children.map((child: any) => child.offsetWidth)),
                        } as State);
                    }
                }}
            >{this.state.dirStat.map((file: any) => renderFile(file, this.state.itemWidth))}</div>;
        } else {
            return <div>Loading...</div>;
        }
    }
}

PluginManager.registerOutputDecorator({
    decorate: (job: Job): React.ReactElement<any> => {
        const match = job.prompt.value.match(/^ls(?:\s+([/\w]*))\s*$/);
        const inputDir = match ? match[1] : ".";
        const dir = isAbsolute(inputDir) ? inputDir : join(job.environment.pwd, inputDir);
        return <LSComponent path={dir} />;
    },

    isApplicable: (job: Job): boolean => {
        // Matches ls page with an optional single arg
        return /^ls(\s+[/\w]*)?\s*$/.test(job.prompt.value);
    },
});
