import {string, token, sequence, choice, withoutSuggestions} from "../../Parser";
import {relativeFilePath} from "./File";

const redirectToken = withoutSuggestions(token(choice([
    string(">"),
    string(">>"),
])));

export const redirect = sequence(redirectToken, relativeFilePath);
