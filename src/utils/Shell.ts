import {basename} from "path";
import * as Path from "path";
import {resolveFile, io, isWindows, filterAsync, homeDirectory} from "./Common";
import {executeCommandWithShellConfig} from "../PTY";

abstract class Shell {
    abstract get executableName(): string;
    abstract get configFiles(): string[];
    abstract get noConfigSwitches(): string[];
    abstract get executeCommandSwitches(): string[];
    abstract get interactiveCommandSwitches(): string[];
    abstract get preCommandModifiers(): string[];
    abstract get commandExecutorPath(): string;
    abstract get environmentCommand(): string;
    abstract loadAliases(): Promise<string[]>;

    abstract combineCommands(commands: string[]): string;

    async existingConfigFiles(): Promise<string[]> {
        const resolvedConfigFiles = this.configFiles.map(fileName => resolveFile(homeDirectory, fileName));
        return await filterAsync(resolvedConfigFiles, io.fileExists);
    }
}

abstract class UnixShell extends Shell {
    get executeCommandSwitches() {
        return ["-c"];
    }

    get interactiveCommandSwitches() {
        return ["-i", "-c"];
    }

    get commandExecutorPath() {
        return "/bin/bash";
    }

    get environmentCommand() {
        return "env";
    }

    loadAliases() {
        return executeCommandWithShellConfig("alias");
    }

    combineCommands(commands: string[]) {
        return `'${commands.join("; ")}'`;
    }
}

class Bash extends UnixShell {
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
}

class ZSH extends UnixShell {
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
}

class Cmd extends Shell {
    static get cmdPath() {
        return Path.join(process.env.WINDIR!, "System32", "cmd.exe");
    }

    get executableName() {
        return "cmd.exe";
    }

    get configFiles() {
        return [
        ];
    }

    get executeCommandSwitches() {
        return ["/c"];
    }

    get interactiveCommandSwitches() {
        return ["/c"];
    }

    get noConfigSwitches() {
        return [];
    }

    get preCommandModifiers(): string[] {
        return [];
    }

    get commandExecutorPath() {
        return Cmd.cmdPath;
    }

    get environmentCommand() {
        return "set";
    }

    combineCommands(commands: string[]) {
        return `"${commands.join(" && ")}`;
    }

    async loadAliases() {
        return [];
    }
}

const supportedShells: Dictionary<Shell> = {
    bash: new Bash(),
    zsh: new ZSH(),
    "cmd.exe": new Cmd(),
};

const shell = (): string => {
    const shellName = process.env.SHELL ? basename(process.env.SHELL!) : "";
    if (shellName in supportedShells) {
        return shellName;
    } else {
        const defaultShell = isWindows ? Cmd.cmdPath : "/bin/bash";
        console.error(`${shellName} is not supported; defaulting to ${defaultShell}`);
        return defaultShell;
    }
};

export const loginShell: Shell = supportedShells[basename(shell())];
