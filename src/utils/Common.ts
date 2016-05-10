import {walk} from "fs-extra";
import * as Path from "path";
import * as i from "./../Interfaces";
import * as e from "./../Enums";
import * as _ from "lodash";
import * as fs from "fs";
import {KeyCode} from "./../Enums";

interface FSExtraWalkObject {
    path: string;
    stats: fs.Stats;
}

export function info(...args: any[]): void {
    print(e.LogLevel.Info, args);
}

export function debug(...args: any[]): void {
    print(e.LogLevel.Debug, args);
}

export function log(...args: any[]): void {
    print(e.LogLevel.Log, args);
}

export function error(...args: any[]): void {
    print(e.LogLevel.Error, args);
}

export function print(level: e.LogLevel, args: Array<any>): void {
    if ((typeof window !== "undefined") && window.DEBUG) {
        (<Function>(<any>console)[level])(...args);
    }
}

export function times(n: number, action: Function): void {
    for (let i = 0; i !== n; ++i) {
        action();
    }
}

async function filesIn(directoryPath: string): Promise<string[]> {
    if (await exists(directoryPath) && await isDirectory(directoryPath)) {
        return await readDirectory(directoryPath);
    } else {
        return [];
    }
}

export function recursiveFilesIn(directoryPath: string): Promise<string[]> {
    let files: string[] = [];

    return new Promise(resolve =>
        walk(directoryPath)
            .on("data", (file: FSExtraWalkObject) => file.stats.isFile() && files.push(file.path))
            .on("end", () => resolve(files))
    );
}

export function stat(filePath: string): Promise<fs.Stats> {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (error: NodeJS.ErrnoException, pathStat: fs.Stats) => {
            if (error) {
                reject(error);
            } else {
                resolve(pathStat);
            }
        });
    });
}

export async function statsIn(directoryPath: string): Promise<i.FileInfo[]> {
    return Promise.all((await filesIn(directoryPath)).map(async (fileName) => {
        return {name: fileName, stat: await stat(Path.join(directoryPath, fileName))};
    }));
}

export function exists(filePath: string): Promise<boolean> {
    return new Promise(resolve => fs.exists(filePath, resolve));
}

export async function isDirectory(directoryPath: string): Promise<boolean> {
    if (await exists(directoryPath)) {
        return (await stat(directoryPath)).isDirectory();
    } else {
        return false;
    }
}

export function readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (error, buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(buffer.toString());
            }
        });
    });
}

export function readDirectory(directoryPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (readError: NodeJS.ErrnoException, files: Array<string>) => {
            if (readError) {
                reject(readError);
            }

            resolve(files);
        });
    });
}

export function normalizeDirectory(directoryPath: string): string {
    return Path.normalize(directoryPath + Path.sep);
}

export function directoryName(path: string): string {
    return normalizeDirectory(path.endsWith(Path.sep) ? path : Path.dirname(path));
}

export function baseName(path: string): string {
    if (path.split(Path.sep).length === 1) {
        return path;
    } else {
        return path.substring(directoryName(path).length);
    }
}

export const {executablesInPaths} = new class {
    private executables: Array<string> = [];

    executablesInPaths = async (paths: string): Promise<string[]> => {
        if (this.executables.length) {
            return this.executables;
        }

        const validPaths = await filterAsync(paths.split(Path.delimiter), isDirectory);
        const allFiles: string[][] = await Promise.all(validPaths.map(filesIn));

        return _.uniq(_.flatten(allFiles));
    };
};

export const {shell} = new class {
    /* tslint:disable:member-ordering */
    private shellPath: string;
    private supportedShells = { bash: true, zsh: true };

    shell = () => {
        if (!this.shellPath) {
            const shellName = baseName(process.env.SHELL);
            if (shellName in this.supportedShells) {
                this.shellPath = process.env.SHELL;
            } else {
                this.shellPath = "/bin/bash";
                console.error(`${shellName} is not supported; defaulting to ${this.shellPath}`);
            }
        }

        return this.shellPath;
    };
};

export function homeDirectory(): string {
    return process.env[(isWindows()) ? "USERPROFILE" : "HOME"];
}

export function resolveDirectory(pwd: string, directory: string): string {
    return normalizeDirectory(resolveFile(pwd, directory));
}

export function resolveFile(pwd: string, file: string): string {
    return Path.resolve(pwd, file.replace(/^~/, homeDirectory()));
}

export function userFriendlyPath(path: string): string {
    return path.replace(homeDirectory(), "~");
}

export async function filterAsync<T>(values: T[], asyncPredicate: (t: T) => Promise<boolean>): Promise<T[]> {
    const filtered = await Promise.all(values.map(asyncPredicate));
    return values.filter((value: T, index: number) => filtered[index]);
}

export async function reduceAsync<A, E>(array: E[], initial: A, callback: (a: A, e: E) => Promise<A>): Promise<A> {
    let accumulator = initial;

    for (const element of array) {
        accumulator = await callback(accumulator, element);
    }

    return accumulator;
}

export function pluralize(word: string, count = 2) {
    return count === 1 ? word : pluralFormOf(word);
}

function pluralFormOf(word: string) {
    if (word.endsWith("y")) {
        return word.substring(0, word.length - 1) + "ies";
    } else {
        return word + "s";
    }
}

export function isWindows(): boolean {
    return process.platform === "win32";
}

export function groupWhen<T>(grouper: (a: T, b: T) => boolean, row: T[]): T[][] {
    if (row.length === 0) return [];
    if (row.length === 1) return [row];

    const result: T[][] = [];
    const firstValue = row[0];
    let currentGroup: T[] = [firstValue];
    let previousValue: T = firstValue;

    row.slice(1).forEach(currentValue => {
        if (grouper(currentValue, previousValue)) {
            currentGroup.push(currentValue);
        } else {
            result.push(currentGroup);
            currentGroup = [currentValue];
        }

        previousValue = currentValue;
    });
    result.push(currentGroup);

    return result;
}


/**
 * @link https://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
 * @link http://unixpapa.com/js/key.html
 * @link http://www.cambiaresearch.com/articles/15/javascript-key-codes
 */
export function convertKeyCode(keyCode: number, shift: boolean): string {
    switch (keyCode) {
        case KeyCode.Backspace:
            return String.fromCharCode(127);
        case KeyCode.Tab:
            return String.fromCharCode(KeyCode.Tab);
        case KeyCode.CarriageReturn:
            return String.fromCharCode(KeyCode.CarriageReturn);
        case KeyCode.Escape:
            return String.fromCharCode(KeyCode.Escape);
        case KeyCode.Space:
            return " ";
        case KeyCode.Left:
            return "\x1b[D";
        case KeyCode.Up:
            return "\x1b[A";
        case KeyCode.Right:
            return "\x1b[C";
        case KeyCode.Down:
            return "\x1b[B";
        case 48:
            return shift ? ")" : "0";
        case 49:
            return shift ? "!" : "1";
        case 50:
            return shift ? "@" : "2";
        case 51:
            return shift ? "#" : "3";
        case 52:
            return shift ? "$" : "4";
        case 53:
            return shift ? "%" : "5";
        case 54:
            return shift ? "^" : "6";
        case 55:
            return shift ? "&" : "7";
        case 56:
            return shift ? "*" : "8";
        case 57:
            return shift ? "(" : "9";
        case 65:
            return shift ? "A" : "a";
        case 66:
            return shift ? "B" : "b";
        case 67:
            return shift ? "C" : "c";
        case 68:
            return shift ? "D" : "d";
        case 69:
            return shift ? "E" : "e";
        case 70:
            return shift ? "F" : "f";
        case 71:
            return shift ? "G" : "g";
        case 72:
            return shift ? "H" : "h";
        case 73:
            return shift ? "I" : "i";
        case 74:
            return shift ? "J" : "j";
        case 75:
            return shift ? "K" : "k";
        case 76:
            return shift ? "L" : "l";
        case 77:
            return shift ? "M" : "m";
        case 78:
            return shift ? "N" : "n";
        case 79:
            return shift ? "O" : "o";
        case 80:
            return shift ? "P" : "p";
        case 81:
            return shift ? "Q" : "q";
        case 82:
            return shift ? "R" : "r";
        case 83:
            return shift ? "S" : "s";
        case 84:
            return shift ? "T" : "t";
        case 85:
            return shift ? "U" : "u";
        case 86:
            return shift ? "V" : "v";
        case 87:
            return shift ? "W" : "w";
        case 88:
            return shift ? "X" : "x";
        case 89:
            return shift ? "Y" : "y";
        case 90:
            return shift ? "Z" : "z";
        case 186:
            return shift ? ":" : ";";
        case 187:
            return shift ? "+" : "=";
        case 188:
            return shift ? "<" : ",";
        case 189:
            return shift ? "_" : "-";
        case 190:
            return shift ? ">" : ".";
        case 191:
            return shift ? "?" : "/";
        case 192:
            return shift ? "~" : "`";
        case 219:
            return shift ? "{" : "[";
        case 220:
            return shift ? "|" : "\\";
        case 221:
            return shift ? "}" : "]";
        case 222:
            return shift ? "\"" : "'";
        default:
            throw `Unknown key code: ${keyCode}`;
    }
}

export function commonPrefix(left: string, right: string) {
    let i = 0;

    while (i < left.length && left.charAt(i) === right.charAt(i)) {
        ++i;
    }
    return left.substring(0, i);
}

export function compose<A, B, C>(f: (fp: A) => B, g: (gp: B) => C): (rp: A) => C {
    return (p: A) => g(f(p));
}

export function mapObject<T, R>(object: Dictionary<T>, mapper: (key: string, value: T) => R): R[] {
    const result: R[] = [];

    for (const key of Object.keys(object)) {
        result.push(mapper(key, object[key]));
    }

    return result;
}
