import {string, token, spacesWithoutSuggestion, many, sequence, noisySuggestions, choice} from "../../Parser";
import {relativeFilePath} from "./File";

const redirectToken = choice([
    noisySuggestions(sequence(many(spacesWithoutSuggestion), token(string(">")))),
    noisySuggestions(sequence(many(spacesWithoutSuggestion), token(string(">>")))),
]);

export const redirect = sequence(redirectToken, relativeFilePath);
