import {Context, Result} from "../src/shell/Parser";
import * as _ from "lodash";
import {Suggestion} from "../src/plugins/autocompletion_providers/Suggestions";
import {Environment} from "../src/Environment";
import {OrderedSet} from "../src/utils/OrderedSet";
import {Token} from "../src/shell/Scanner";

export const defaultContext = new Context(
    [],
    "/",
    new OrderedSet<string>(),
    new Environment({})
);

export const context = (input: Token[]) => defaultContext.withInput(input);

const suggestionProperties = <A>(getter: (s: Suggestion) => A) => (results: Result[]) => _.flatten(results.map(result => result.suggestions.map(getter)));

export const suggestionDisplayValues = suggestionProperties(suggestion => suggestion.displayValue);
