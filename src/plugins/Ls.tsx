import * as React from "React";
import {PluginManager} from "../PluginManager";
import {join, isAbsolute} from "path";
import {dirStat} from "dirStat";
import * as e from "electron";
import {CSSObject} from "../views/css/definitions";
import {isEqual} from "lodash";
import {colors} from "../views/css/colors";

type Props = {
    files: any[],
}

type State = {
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
        onClick={() => e.shell.openExternal(`file://${file.filePath}`)}
        className="underlineOnHover">
        <span style={{color: file.isDirectory() ? colors.blue : colors.white}}>{file.fileName}</span>
        <span>{file.isDirectory() ? "/" : ""}</span>
    </span>;
};

class LSComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            itemWidth: undefined,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return !(isEqual(this.props, nextProps) && isEqual(this.state, nextState));
    }

    render() {
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
        >{this.props.files.map((file: any) => renderFile(file, this.state.itemWidth))}</div>;
    }
}

PluginManager.registerCommandInterceptorPlugin({
    intercept: async({
        command,
        presentWorkingDirectory,
    }): Promise<React.ReactElement<any>> => {
        const inputDir = command[1] || ".";
        const dir = isAbsolute(inputDir) ? inputDir : join(presentWorkingDirectory, inputDir);
        const files: any[] = await new Promise<any[]>((resolve, reject) => {
            dirStat(dir, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
        return <LSComponent files={files} />;
    },

    isApplicable: ({ command }): boolean => {
        const hasFlags = command.length === 2 && command[1].startsWith("-");
        return [1, 2].includes(command.length) && !hasFlags && command[0] === "ls";
    },
});
