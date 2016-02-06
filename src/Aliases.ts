import {linedOutputOf} from "./PTY";
import {memoize} from "./Decorators";
import Utils from "./Utils";

export default class Aliases {
    static async find(alias: string): Promise<string> {
        return (await this.all())[alias];
    }

    @memoize()
    static async all(): Promise<Dictionary<string>> {
        const shellPath: string = process.env.SHELL;
        const shellName = Utils.baseName(shellPath);
        const sourceCommands = (await existingConfigFiles(shellName)).map(fileName => `source ${fileName}`);
        const lines = await linedOutputOf(shellPath, ["-c", `'${[...sourceCommands, "alias"].join("; ")}'`], process.env.HOME);

        return lines.reduce(
            (accumulator: Dictionary<string>, aliasLine: string) => {
                let split = aliasLine.split("=");

                let name = /(alias )?(.*)/.exec(split[0])[2];
                let value = /'?([^']*)'?/.exec(split[1])[1];

                accumulator[name] = value;
                return accumulator;
            },
            <Dictionary<string>>{}
        );
    }
}

async function existingConfigFiles(shellName: string): Promise<string[]> {
    const resolvedConfigFiles = configFiles(shellName).map(fileName => Utils.resolveFile(process.env.HOME, fileName));
    return await Utils.filterAsync(resolvedConfigFiles, Utils.exists);
}

function configFiles(shellName: string): string[] {
    switch (shellName) {
        case "zsh":
            return ["~/.zshrc", "~/.zsh_profile"];
        case "bash":
            return ["~/.bashrc", "~/.bash_profile"];
        default:
            return [];
    }
}
