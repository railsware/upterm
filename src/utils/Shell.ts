import {baseName, resolveFile, exists, filterAsync} from "./Common";

abstract class Shell {
    abstract get executableName(): string;
    abstract get configFiles(): string[];
    abstract get noConfigSwitches(): string[];

    async existingConfigFiles(): Promise<string[]> {
        const resolvedConfigFiles = this.configFiles.map(fileName => resolveFile(process.env.HOME, fileName));
        return await filterAsync(resolvedConfigFiles, exists);
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
}

const supportedShells: Dictionary<Shell> = {
    bash: new Bash(),
    zsh: new ZSH() ,
};

const {shell} = new class {
    /* tslint:disable:member-ordering */
    private shellPath: string;

    shell = () => {
        if (!this.shellPath) {
            const shellName = baseName(process.env.SHELL);
            if (shellName in supportedShells) {
                this.shellPath = process.env.SHELL;
            } else {
                this.shellPath = "/bin/bash";
                console.error(`${shellName} is not supported; defaulting to ${this.shellPath}`);
            }
        }

        return this.shellPath;
    };
};

export const loginShell: Shell = supportedShells[baseName(shell())];
