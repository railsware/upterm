import {basename} from "path";
import {resolveFile, exists, filterAsync} from "./Common";

abstract class Shell {
    abstract get executableName(): string;
    abstract get configFiles(): string[];
    abstract get noConfigSwitches(): string[];
    abstract get preCommandModifiers(): string[];

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

    get preCommandModifiers(): string[] {
        return [];
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
