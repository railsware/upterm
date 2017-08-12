import {services} from "../services/index";
import {windowBoundsFilePath} from "../utils/Common";
import {outputJSON} from "fs-extra";

services.window.onBoundsChange.subscribe(bounds => outputJSON(windowBoundsFilePath, bounds));
