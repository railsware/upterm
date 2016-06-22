import {string, token, choice, withoutSuggestions} from "../../shell/Parser";

const redirectToken = withoutSuggestions(token(choice([
    string(">"),
    string(">>"),
])));

export const redirect = redirectToken;
