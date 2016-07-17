import {basename} from "path";
import {readFileSync, statSync} from "fs";
import * as Path from "path";
import {EOL} from "os";
import {resolveFile, exists, filterAsync, homeDirectory} from "./Common";

abstract class Shell {
    abstract get executableName(): string;
    abstract get configFiles(): string[];
    abstract get noConfigSwitches(): string[];
    abstract get preCommandModifiers(): string[];
    abstract get historyFileName(): string;

    async existingConfigFiles(): Promise<string[]> {
        const resolvedConfigFiles = this.configFiles.map(fileName => resolveFile(process.env.HOME, fileName));
        return await filterAsync(resolvedConfigFiles, exists);
    }

    loadHistory(): { lastModified: Date, commands: string[] } {
        const path = process.env.HISTFILE || Path.join(homeDirectory, this.historyFileName);
        try {
            return {
                lastModified: statSync(path).mtime,
                commands: readFileSync(path).toString().trim().split(EOL).reverse().map(line => _.last(line.split(";"))),
            };
        } catch (error) {
            return {
                lastModified: new Date(0),
                commands: [],
            };
        }
    }
}

class Bash extends Shell {
    get executableName() {
        return "bash";
    }

    get configFiles() {
        return ["~/.bashrc", "~/.bash_profile"];
    }

    get noConfigSwitches() {
        return ["--noprofile", "--norc"];
    }

    get preCommandModifiers(): string[] {
        return [];
    }

    get historyFileName(): string {
        return ".bash_history";
    }
}

class ZSH extends Shell {
    get executableName() {
        return "zsh";
    }

    get configFiles() {
        return ["~/.zshrc", "~/.zsh_profile"];
    }

    get noConfigSwitches() {
        return ["--no-globalrcs", "--no-rcs"];
    }

    get preCommandModifiers() {
        return [
            "-",
            "noglob",
            "nocorrect",
            "exec",
            "command",
        ];
    }

    get historyFileName(): string {
        return ".zsh_history";
    }
}

const supportedShells: Dictionary<Shell> = {
    bash: new Bash(),
    zsh: new ZSH() ,
};

const shell = () => {
    const shellName = basename(process.env.SHELL);
    if (shellName in supportedShells) {
        return process.env.SHELL;
    } else {
        console.error(`${shellName} is not supported; defaulting to /bin/bash`);
        return "/bin/bash";
    }
};

export const loginShell: Shell = supportedShells[basename(shell())];
