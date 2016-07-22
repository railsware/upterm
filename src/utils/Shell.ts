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
        return [
            // List drawn from GNU bash 4.3 man page INVOCATION section.
            // ~/.bashrc is only supposed to be used for non-login shells
            // and ~/.bash_profile is only supposed to be used for login
            // shells, but load both anyway because that's what people expect.
            "/etc/profile",
            "~/.bash_profile",
            "~/.bash_login",
            "~/.profile",
            "~/.bashrc",
        ];
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
        return [
            // List drawn from zhs 5.0.8 man page STARTUP/SHUTDOWN FILES section.
            "/etc/zshenv",
            Path.join(process.env.ZDOTDIR || "~", ".zshenv"),
            "/etc/zprofile",
            Path.join(process.env.ZDOTDIR || "~", ".zprofile"),
            "/etc/zshrc",
            Path.join(process.env.ZDOTDIR || "~", ".zshrc"),
            "/etc/zlogin",
            Path.join(process.env.ZDOTDIR || "~", ".zlogin"),
            // This one is not listed in the man pages, but some zsh installations do use it.
            "~/.zsh_profile",
        ];
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
