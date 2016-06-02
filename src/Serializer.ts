import * as _ from "lodash";
import History from "./History";

export default class Serializer {
    static serialize(serializable: any): string {
        if (typeof serializable.serialize === "function") {
            return serializable.serialize();
        } else if (typeof serializable === "string") {
            return `String:${serializable}`;
        } else {
            throw `Don"t know how to serialize ${serializable}`;
        }
    }

    static deserialize(serialized: string): any {
        if (_.startsWith(serialized, "String:")) {
            return serialized.slice("String:".length);
        } else if (_.startsWith(serialized, "History:")) {
            return History.deserialize(serialized.slice("History:".length));
        } else {
            throw `Don"t know how to deserialize ${serialized}`;
        }
    }
}
