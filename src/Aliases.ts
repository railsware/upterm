import {executeCommandWithShellConfig} from "./PTY";
import {memoize} from "./Decorators";

export class Aliases {
    static async find(alias: string): Promise<string> {
        return (await this.all())[alias];
    }

    @memoize()
    static async all(): Promise<Dictionary<string>> {
        const lines = await executeCommandWithShellConfig("alias");

        return lines.reduce(
            (accumulator: Dictionary<string>, aliasLine: string) => {
                let [short, long] = aliasLine.split("=");

                if (short && long) {
                    const nameCapture = /(alias )?(.*)/.exec(short);
                    const valueCapture = /'?([^']*)'?/.exec(long);

                    if (nameCapture && valueCapture) {
                        accumulator[nameCapture[2]] = valueCapture[1];
                    } else {
                        throw `Alias line is incorrect: ${aliasLine}`;
                    }
                } else {
                    throw `Can't parse alias line: ${aliasLine}`;
                }

                return accumulator;
            },
            <Dictionary<string>>{}
        );
    }
}
