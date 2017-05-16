import * as walk from "klaw";
import * as Path from "path";
import * as i from "./../Interfaces";
import * as e from "./../Enums";
import * as _ from "lodash";
import * as fs from "fs-extra";
import {KeyCode} from "./../Enums";
import {EnvironmentPath} from "../shell/Environment";

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

export const readIO = {
    filesIn: async (directoryPath: FullPath): Promise<string[]> => {
        if (await io.exists(directoryPath) && await io.isDirectory(directoryPath)) {
            return await io.readDirectory(directoryPath);
        } else {
            return [];
        }
    },
    recursiveFilesIn: (directoryPath: string): Promise<string[]> => {
        let files: string[] = [];

        return new Promise(resolve =>
            walk(directoryPath)
                .on("data", (file: FSExtraWalkObject) => file.stats.isFile() && files.push(file.path))
                .on("end", () => resolve(files)),
        );
    },
    lstat: (filePath: string): Promise<fs.Stats> => {
        return new Promise((resolve, reject) => {
            fs.lstat(filePath, (error: NodeJS.ErrnoException, pathStat: fs.Stats) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(pathStat);
                }
            });
        });
    },
    lstatsIn: async (directoryPath: FullPath): Promise<i.FileInfo[]> => {
        return Promise.all((await io.filesIn(directoryPath)).map(async (fileName) => {
            return {name: fileName, stat: await io.lstat(Path.join(directoryPath, fileName))};
        }));
    },
    exists: (filePath: string): Promise<boolean> => {
        return new Promise(resolve => fs.exists(filePath, resolve));
    },
    isDirectory: async (directoryPath: string): Promise<boolean> => {
        if (await io.exists(directoryPath)) {
            return (await io.lstat(directoryPath)).isDirectory();
        } else {
            return false;
        }
    },
    readFile: (filePath: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (error, buffer) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(buffer.toString());
                }
            });
        });
    },
    readDirectory: (directoryPath: string): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            fs.readdir(directoryPath, (readError: NodeJS.ErrnoException, files: Array<string>) => {
                if (readError) {
                    reject(readError);
                }

                resolve(files);
            });
        });
    },
    executablesInPaths: async (path: EnvironmentPath): Promise<string[]> => {
        const validPaths = await filterAsync(path.toArray(), io.isDirectory);
        const allFiles: string[][] = await Promise.all(validPaths.map(io.filesIn));

        return _.uniq(_.flatten(allFiles));
    },
};

export const writeIO = {
    writeFileCreatingParents: async (filePath: string, content: string): Promise<void> => {
        await fs.ensureDir(Path.dirname(filePath));
        return fs.writeFile(filePath, content);
    },
};

export const io: typeof readIO & typeof writeIO = {...readIO, ...writeIO};

/**
 * Unlike Path.join, doesn't remove ./ and ../ parts.
 */
export function joinPath(...parts: string[]) {
    const initialParts = parts.slice(0, -1).filter(part => part.length);
    const lastPart = parts[parts.length - 1];

    return initialParts.map(normalizeDirectory).join("") + lastPart;
}

export function normalizeDirectory(directoryPath: string): string {
    if (directoryPath.endsWith(Path.sep)) {
        return directoryPath;
    } else {
        return directoryPath + Path.sep;
    }
}

export function directoryName(path: string): string {
    const directoryParts = path.split(Path.sep).slice(0, -1);

    if (directoryParts.length === 0) {
        return "";
    } else {
        return normalizeDirectory(directoryParts.join(Path.sep));
    }
}

export const isWindows = process.platform === "win32";
export const homeDirectory = process.env[(isWindows) ? "USERPROFILE" : "HOME"];

export function resolveDirectory(pwd: string, directory: string): FullPath {
    return <FullPath>normalizeDirectory(resolveFile(pwd, directory));
}

export function resolveFile(pwd: string, file: string): FullPath {
    return <FullPath>Path.resolve(pwd, file.replace(/^~/, homeDirectory));
}

export function userFriendlyPath(path: string): string {
    return path.replace(homeDirectory, "~");
}

export async function filterAsync<T>(values: T[], asyncPredicate: (t: T) => Promise<boolean>): Promise<T[]> {
    const filtered = await Promise.all(values.map(asyncPredicate));
    return values.filter((_value: T, index: number) => filtered[index]);
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

const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
];

export function isImage(extension: string) {
    return imageExtensions.includes(extension);
}

function pluralFormOf(word: string) {
    if (word.endsWith("y")) {
        return word.substring(0, word.length - 1) + "ies";
    } else {
        return word + "s";
    }
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

export function csi(char: string) {
    return `\x1b[${char}`;
}

export function ss3(char: string) {
    return `\x1bO${char}`;
}

/**
 * @link https://www.w3.org/TR/uievents/#widl-KeyboardEvent-key
 */
export function normalizeKey(key: string, isCursorKeysModeSet: boolean): string {
    switch (key) {
        case "Backspace":
            return String.fromCharCode(127);
        case "Tab":
            return String.fromCharCode(KeyCode.Tab);
        case "Enter":
            return String.fromCharCode(KeyCode.CarriageReturn);
        case "Escape":
            return String.fromCharCode(KeyCode.Escape);
        case "ArrowLeft":
            return isCursorKeysModeSet ? ss3("D") : csi("D");
        case "ArrowUp":
            return isCursorKeysModeSet ? ss3("A") : csi("A");
        case "ArrowRight":
            return isCursorKeysModeSet ? ss3("C") : csi("C");
        case "ArrowDown":
            return isCursorKeysModeSet ? ss3("B") : csi("B");
        case "F1":
            return ss3("P");
        case "F2":
            return ss3("Q");
        case "F3":
            return ss3("R");
        case "F4":
            return ss3("S");
        case "F5":
            return csi("15~");
        case "F6":
            return csi("17~");
        case "F7":
            return csi("18~");
        case "F8":
            return csi("19~");
        case "F9":
            return csi("20~");
        case "F10":
            return csi("21~");
        case "F11":
            return csi("23~");
        case "F12":
            return csi("24~");
        default:
            return key;
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

export function escapeFilePath(unescaped: string): string {
  return unescaped.replace(/([\s'"\[\]<>#$%^&*()])/g, "\\$1");
}

const baseConfigDirectory = Path.join(homeDirectory, ".black-screen");
export const presentWorkingDirectoryFilePath = Path.join(baseConfigDirectory, "presentWorkingDirectory");
export const historyFilePath = Path.join(baseConfigDirectory, "history");
export const windowBoundsFilePath = Path.join(baseConfigDirectory, "windowBounds");
