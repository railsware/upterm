import {choice, runtime, string, decorate, token, noisySuggestions} from "../../Parser";
import {styles, style, description} from "./Suggestions";
import {compose} from "../../utils/Common";

export const environmentVariable = runtime(async(context) => {
    return noisySuggestions(
        choice(
            context.environment.map((key, value) =>
                decorate(token(string("$" + key)), compose(description(value), style(styles.environmentVariable)))
            )
        )
    );
});
