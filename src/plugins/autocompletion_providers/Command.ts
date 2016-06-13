import {git} from "./Git";
import {cd} from "./Cd";
import {npm} from "./NPM";
import {rails} from "./Rails";
import {choice, executable} from "../../shell/Parser";

const ls = executable("ls");

export const command = choice([
    ls,
    git,
    cd,
    npm,
    rails,
]);
