import * as React from "react";
import {PluginManager} from "../PluginManager";
import {join, isAbsolute} from "path";
import {dirStat} from "dirStat";
import {CSSObject} from "../views/css/definitions";
import {isEqual} from "lodash";
import {colors} from "../views/css/colors";
import Link from "../utils/Link";

type Props = {
    files: any[],
}

type State = {
    itemWidth: number | undefined,
}

const renderFile = (file: any, itemWidth = 0, key: number) => {
    const style: CSSObject = {display: "inline-block"};
    if (itemWidth) {
        // TODO: respect LSCOLORS env var
        style.width = `${itemWidth}px`;
        style.cursor = "pointer";
        style.margin = "2px 4px";
    }
    return <Link key={key} absolutePath={file.filePath} style={style}>
        <span style={{color: file.isDirectory() ? colors.blue : colors.white}}>{file.fileName}</span>
        <span>{file.isDirectory() ? "/" : ""}</span>
    </Link>;
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
        >{this.props.files.map((file: any, index: number) => renderFile(file, this.state.itemWidth, index))}</div>;
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
