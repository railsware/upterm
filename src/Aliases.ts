import {executeCommandWithShellConfig} from "./PTY";
import {memoize} from "./Decorators";

export default class Aliases {
    static async find(alias: string): Promise<string> {
        return (await this.all())[alias];
    }

    @memoize()
    static async all(): Promise<Dictionary<string>> {
        const lines = await executeCommandWithShellConfig("alias");

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
