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

    static async filesIn(directoryPath: string): Promise<string[]> {
        if (await Utils.exists(directoryPath) && await Utils.isDirectory(directoryPath)) {
            return await Utils.readDirectory(directoryPath);
        } else {
            return [];
        }
    }

    static recursiveFilesIn(directoryPath: string): Promise<string[]> {
        let files: string[] = [];

        return new Promise(resolve =>
            walk(directoryPath)
                .on("data", (file: FSExtraWalkObject) => file.stats.isFile() && files.push(file.path))
                .on("end", () => resolve(files))
        );
    }

    static stat(filePath: string): Promise<Stats> {
        return new Promise((resolve, reject) => {
            stat(filePath, (error: NodeJS.ErrnoException, pathStat: Stats) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(pathStat);
                }
            });
        });
    }

    static stats(directoryPath: string): Promise<i.FileInfo[]> {
        return Utils.filesIn(directoryPath).then(files =>
            Promise.all(files.map(fileName =>
                new Promise((resolve, reject) =>
                    stat(Path.join(directoryPath, fileName), (error: NodeJS.ErrnoException, stat: Stats) => {
                        if (error) {
                            reject(error);
                        }

                        resolve({name: fileName, stat: stat});
                    })
                )
            ))
        );
    }

    static exists(filePath: string): Promise<boolean> {
        return new Promise(resolve => exists(filePath, resolve));
    }

    static async isDirectory(directoryPath: string): Promise<boolean> {
        if (await Utils.exists(directoryPath)) {
            return (await Utils.stat(directoryPath)).isDirectory();
        } else {
            return false;
        }
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

    static readDirectory(directoryPath: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            readdir(directoryPath, (readError: NodeJS.ErrnoException, files: Array<string>) => {
                if (readError) {
                    reject(readError);
                }

                resolve(files);
            });
        });
    }

    static normalizeDirectory(directoryPath: string): string {
        return Path.normalize(directoryPath + Path.sep);
    }

    static directoryName(path: string): string {
        return this.normalizeDirectory(path.endsWith(Path.sep) ? path : Path.dirname(path));
    }

    static baseName(path: string): string {
        if (path.split(Path.sep).length === 1) {
            return path;
        } else {
            return path.substring(this.directoryName(path).length);
        }
    }

    static async executablesInPaths(paths: string): Promise<string[]> {
        if (this.executables.length) {
            return this.executables;
        }

        const validPaths = await this.filterAsync(paths.split(Path.delimiter), this.isDirectory);
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
        return Utils.normalizeDirectory(Utils.resolveFile(pwd, directory));
    }

    static resolveFile(pwd: string, file: string): string {
        return Path.resolve(pwd, file.replace(/^~/, Utils.homeDirectory));
    }

    static async filterAsync<T>(values: T[], asyncPredicate: (t: T) => Promise<boolean>): Promise<T[]> {
        const filtered = await Promise.all(values.map(asyncPredicate));
        return values.filter((value: T, index: number) => filtered[index]);
    }

    static pluralize(word: string, count = 2) {
        return count === 1 ? word : this.pluralFormOf(word);
    }

    private static pluralFormOf(word: string) {
        if (word.endsWith("y")) {
            return word.substring(0, word.length - 1) + "ies";
        } else {
            return word + "s";
        }
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
