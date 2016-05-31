import {pathInCurrentDirectory} from "./Common";

export const relativeFilePath = pathInCurrentDirectory(() => true);
export const relativeDirectoryPath = pathInCurrentDirectory(info => info.stat.isDirectory());
