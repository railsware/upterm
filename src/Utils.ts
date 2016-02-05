import {walk} from "fs-extra";
import * as Path from "path";
import * as i from "./Interfaces";
import * as e from "./Enums";
import * as _ from "lodash";
import {Stats, readFile, exists, readdir, stat} from "fs";

interface FSExtraWalkObject {
    path: string;
    stats: Stats;
}

export default class Utils {
    public static paths: Array<string> = process.env.PATH.split(Path.delimiter);
    public static executables: Array<string> = [];

    static info(...args: any[]): void {
        this.print(e.LogLevel.Info, args);
    }

    static debug(...args: any[]): void {
        this.print(e.LogLevel.Debug, args);
    }

    static log(...args: any[]): void {
        this.print(e.LogLevel.Log, args);
    }

    static error(...args: any[]): void {
        this.print(e.LogLevel.Error, args);
    }

    static print(level: e.LogLevel, args: Array<any>): void {
        if ((typeof window !== "undefined") && window.DEBUG) {
            (<Function>(<any>console)[level])(...args);
        }
    }

    static times(n: number, action: Function): void {
        for (let i = 0; i !== n; ++i) {
            action();
        }
    }

    static filesIn(directory: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            Utils.ifExists(directory, () => {
                stat(directory, (statError: NodeJS.ErrnoException, pathStat: Stats) => {
                    if (statError) {
                        reject(statError);
                    }

                    if (!pathStat.isDirectory()) {
                        reject(`${directory} is not a directory.`);
                    }

                    readdir(directory, (readError: NodeJS.ErrnoException, files: Array<string>) => {
                        if (readError) {
                            reject(readError);
                        }

                        resolve(files);
                    });
                });
            });
        });
    }

    static recursiveFilesIn(directoryPath: string): Promise<string[]> {
        let files: string[] = [];

        return new Promise(resolve =>
            walk(directoryPath)
                .on("data", (file: FSExtraWalkObject) => file.stats.isFile() && files.push(file.path))
                .on("end", () => resolve(files))
        );
    }

    static stats(directory: string): Promise<i.FileInfo[]> {
        return Utils.filesIn(directory).then(files =>
            Promise.all(files.map(fileName =>
                new Promise((resolve, reject) =>
                    stat(Path.join(directory, fileName), (error: NodeJS.ErrnoException, stat: Stats) => {
                        if (error) {
                            reject(error);
                        }

                        resolve({ name: fileName, stat: stat });
                    })
                )
            ))
        );
    }

    static ifExists(fileName: string, callback: Function, elseCallback?: Function) {
        exists(fileName, (pathExists: boolean) => {
            if (pathExists) {
                callback();
            } else if (elseCallback) {
                elseCallback();
            }
        });
    }

    static exists(filePath: string): Promise<boolean> {
        return new Promise(resolve => exists(filePath, resolve));
    }

    static isDirectory(directoryName: string): Promise<boolean> {
        return new Promise((resolve) => {
            Utils.ifExists(
                directoryName,
                () => {
                    stat(directoryName, (error: NodeJS.ErrnoException, pathStat: Stats) => {
                        resolve(pathStat.isDirectory());
                    });
                },
                () => resolve(false));
        });
    }

    static readFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            readFile(filePath, (error, buffer) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(buffer.toString());
                }
            });
        });
    }

    static normalizeDir(path: string): string {
        return Path.normalize(path + Path.sep);
    }

    static dirName(path: string): string {
        return this.normalizeDir(path.endsWith(Path.sep) ? path : Path.dirname(path));
    }

    static baseName(path: string): string {
        if (path.split(Path.sep).length === 1) {
            return path;
        } else {
            return path.substring(this.dirName(path).length);
        }
    }

    static humanFileSize(bytes: number): string {
        const threshold = 1024;
        const units = ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

        if (Math.abs(bytes) < threshold) {
            return bytes + "B";
        }

        let unitIndex = -1;

        do {
            bytes /= threshold;
            ++unitIndex;
        } while (Math.abs(bytes) >= threshold && unitIndex < units.length - 1);

        return bytes.toFixed(1) + "" + units[unitIndex];
    }

    static async executablesInPaths(): Promise<string[]> {
        if (this.executables.length) {
            return this.executables;
        }

        const validPaths = await this.filterAsync(this.paths, this.isDirectory);
        const allFiles: string[][] = await Promise.all(validPaths.map(this.filesIn));

        return _.uniq(_.flatten(allFiles));
    }

    static get isWindows(): boolean {
        return process.platform === "win32";
    }

    static get homeDirectory(): string {
        return process.env[(Utils.isWindows) ? "USERPROFILE" : "HOME"];
    }

    static resolveDirectory(pwd: string, directory: string): string {
        return Utils.normalizeDir(Utils.resolveFile(pwd, directory));
    }

    static resolveFile(pwd: string, file: string): string {
        return Path.resolve(pwd, file.replace(/^~/, Utils.homeDirectory));
    }

    static async filterAsync<T>(values: T[], asyncPredicate: (t: T) => Promise<boolean>): Promise<T[]> {
        const filtered = await Promise.all(values.map(asyncPredicate));
        return values.filter((value: T, index: number) => filtered[index]);
    }

    static pluralize(word: string, count = 2) {
        return count === 1 ? word : word + "s";
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
