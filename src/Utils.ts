import * as fs from "fs";
import * as fse from "fs-extra";
import * as Path from "path";
import * as i from "./Interfaces";
import * as e from "./Enums";
import * as _ from "lodash";

interface FSExtraWalkObject {
    path: string;
    stats: fs.Stats;
}

/* tslint:disable:max-line-length */
const bell = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");

export default class Utils {
    public static paths: Array<string> = process.env.PATH.split(Path.delimiter);
    public static executables: Array<string> = [];

    static playBell() {
        bell.play();
    }

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
                fs.stat(directory, (statError: NodeJS.ErrnoException, pathStat: fs.Stats) => {
                    if (statError) {
                        reject(statError);
                    }

                    if (!pathStat.isDirectory()) {
                        reject(`${directory} is not a directory.`);
                    }

                    fs.readdir(directory, (readError: NodeJS.ErrnoException, files: Array<string>) => {
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
            fse.walk(directoryPath)
                .on("data", (file: FSExtraWalkObject) => file.stats.isFile() && files.push(file.path))
                .on("end", () => resolve(files))
        );
    }

    static stats(directory: string): Promise<i.FileInfo[]> {
        return Utils.filesIn(directory).then(files =>
            Promise.all(files.map(fileName =>
                new Promise((resolve, reject) =>
                    fs.stat(Path.join(directory, fileName), (error: NodeJS.ErrnoException, stat: fs.Stats) => {
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
        fs.exists(fileName, (pathExists: boolean) => {
            if (pathExists) {
                callback();
            } else if (elseCallback) {
                elseCallback();
            }
        });
    }

    static exists(filePath: string): Promise<boolean> {
        return new Promise(resolve => fs.exists(filePath, resolve));
    }

    static isDirectory(directoryName: string): Promise<boolean> {
        return new Promise((resolve) => {
            Utils.ifExists(
                directoryName,
                () => {
                    fs.stat(directoryName, (error: NodeJS.ErrnoException, pathStat: fs.Stats) => {
                        resolve(pathStat.isDirectory());
                    });
                },
                () => resolve(false));
        });
    }

    static readFile(filePath: string): Promise<string> {
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
        return Path.resolve(pwd, directory.replace(/^~/, Utils.homeDirectory));
    }

    static async filterAsync<T>(values: T[], asyncPredicate: (t: T) => Promise<boolean>): Promise<T[]> {
        const filtered = await Promise.all(values.map(asyncPredicate));
        return values.filter((value: T, index: number) => filtered[index]);
    }
}

/**
 * Copied from here: https://ghc.haskell.org/trac/ghc/ticket/1408
 *
 * groupWhen :: (a -> a -> Bool) -> [a] -> [[a]]
 * groupWhen _ []    = []
 * groupWhen _ [a]   = [[a]]
 * groupWhen f (a:l) = if f a (head c) then (a:c):r
 *                                     else [a]:c:r
 *   where (c:r) = groupWhen f l
 *
 * @example groupWhen (<) [1,2,3,2,10,12,10,11] -- Group into strictly increasing sublists
 */
export function groupWhen<A>(f: (a: A, b: A) => boolean, input: A[]): A[][] {
    if (input.length === 0) return [];
    if (input.length === 1) return [input];

    let [a, ...l] = input;
    let [c, ...r] = groupWhen(f, l);

    if (f(a, c[0])) {
        return [[a, ...c], ...r];
    } else {
        return [[a], c, ...r];
    }
}
