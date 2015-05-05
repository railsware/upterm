/// <reference path="../../references.ts" />

module BlackScreen {
    export module Providers {
        export module Command {
            export class Path extends Base {
                private paths: Array<string> = process.env.PATH.split(':');

                constructor() {
                    super();

                    this.paths.forEach((path) => {
                        fs.exists(path, (pathExists) => {
                            if (pathExists) {
                                fs.stat(path, (error, pathStat) => {
                                    if (pathStat.isDirectory()) {
                                        fs.readdir(path, (error, files) => {
                                            var executableNames = files.map((fileName) => {
                                                return fileName.split('/').pop();
                                            });
                                            this.executables = this.executables.concat(executableNames);
                                        })
                                    }
                                });
                            }
                        });
                    });
                }
            }
        }
    }
}
