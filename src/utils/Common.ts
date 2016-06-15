import {walk} from "fs-extra";
import * as Path from "path";
import * as i from "./../Interfaces";
import * as e from "./../Enums";
import * as _ from "lodash";
import * as fs from "fs";
import {KeyCode} from "./../Enums";
import {EnvironmentPath} from "../Environment";

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

export function mkdir(directoryPath: string): Promise<{}> {
    return new Promise(resolve => fs.mkdir(directoryPath, resolve));
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

async function ensureDirectoryExists(filePath: string): Promise<void> {
    const directoryPath = Path.dirname(filePath);
    if (await exists(directoryPath)) {
        return;
    }
    await ensureDirectoryExists(directoryPath);
    await mkdir(directoryPath);
}

export async function writeFileCreatingParents(filePath: string, content: string): Promise<{}> {
    await ensureDirectoryExists(filePath);
    return writeFile(filePath, content);
}

export function writeFile(filePath: string, content: string): Promise<{}> {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
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

    executablesInPaths = async (path: EnvironmentPath): Promise<string[]> => {
        if (this.executables.length) {
            return this.executables;
        }

        const validPaths = await filterAsync(path.toArray(), isDirectory);
        const allFiles: string[][] = await Promise.all(validPaths.map(filesIn));

        return _.uniq(_.flatten(allFiles));
    };
};

export const isWindows = process.platform === "win32";
export const homeDirectory = process.env[(isWindows) ? "USERPROFILE" : "HOME"];

export function resolveDirectory(pwd: string, directory: string): string {
    return normalizeDirectory(resolveFile(pwd, directory));
}

export function resolveFile(pwd: string, file: string): string {
    return Path.resolve(pwd, file.replace(/^~/, homeDirectory));
}

export function userFriendlyPath(path: string): string {
    return path.replace(homeDirectory, "~");
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
 * @link https://www.w3.org/TR/uievents/#widl-KeyboardEvent-key
 */
export function normalizeKey(key: string): string {
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
            return "\x1b[D";
        case "ArrowUp":
            return "\x1b[A";
        case "ArrowRight":
            return "\x1b[C";
        case "ArrowDown":
            return "\x1b[B";
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

const baseConfigDirectory = Path.join(homeDirectory, ".black-screen");
export const currentWorkingDirectoryFilePath = Path.join(baseConfigDirectory, "currentWorkingDirectory");
export const historyFilePath = Path.join(baseConfigDirectory, "history");
export const windowBoundsFilePath = Path.join(baseConfigDirectory, "windowBounds");
