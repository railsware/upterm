import * as _ from "lodash";
import Aliases from "../../Aliases";
import Job from "../../Job";
import PluginManager from "../../PluginManager";
import {Suggestion} from "./Suggestions";
import {memoize} from "../../Decorators";
import {AutocompletionProvider} from "../../Interfaces";

class Alias extends Suggestion {
    constructor(protected _alias: string, protected _expanded: string) {
        super();
    };

    get value() {
        return this._alias;
    }

    get displayValue() {
        return this._alias;
    }

    get description() {
        return `Aliased to “${this._expanded}”.`;
    }

    get synopsis() {
        return this._expanded;
    }

    get type() {
        return "alias";
    }
}

class AliasesProvider implements AutocompletionProvider {
    async getSuggestions(job: Job) {
        if (job.prompt.lexemes.length > 1) {
            return [];
        }

        return this.aliases();
    }

    @memoize()
    private async aliases(): Promise<Alias[]> {
        return _.map(await Aliases.all(), (expanded, alias) => new Alias(alias, expanded));
    }
}

PluginManager.registerAutocompletionProvider(new AliasesProvider());
