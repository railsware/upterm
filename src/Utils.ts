import {walk} from "fs-extra";
import * as Path from "path";
import * as i from "./Interfaces";
import * as e from "./Enums";
import * as _ from "lodash";
import * as fs from "fs";

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

export async function filesIn(directoryPath: string): Promise<string[]> {
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

export function stats(directoryPath: string): Promise<i.FileInfo[]> {
    return filesIn(directoryPath).then(files =>
        Promise.all(files.map(fileName =>
            new Promise((resolve, reject) =>
                fs.stat(Path.join(directoryPath, fileName), (error: NodeJS.ErrnoException, stat: fs.Stats) => {
                    if (error) {
                        reject(error);
                    }

                    resolve({name: fileName, stat: stat});
                })
            )
        ))
    );
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


const executables: Array<string> = [];
export async function executablesInPaths(paths: string): Promise<string[]> {
    if (executables.length) {
        return executables;
    }

    const validPaths = await filterAsync(paths.split(Path.delimiter), isDirectory);
    const allFiles: string[][] = await Promise.all(validPaths.map(filesIn));

    return _.uniq(_.flatten(allFiles));
}

export function homeDirectory(): string {
    return process.env[(isWindows()) ? "USERPROFILE" : "HOME"];
}

export function resolveDirectory(pwd: string, directory: string): string {
    return normalizeDirectory(resolveFile(pwd, directory));
}

export function resolveFile(pwd: string, file: string): string {
    return Path.resolve(pwd, file.replace(/^~/, homeDirectory()));
}

export async function filterAsync<T>(values: T[], asyncPredicate: (t: T) => Promise<boolean>): Promise<T[]> {
    const filtered = await Promise.all(values.map(asyncPredicate));
    return values.filter((value: T, index: number) => filtered[index]);
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
