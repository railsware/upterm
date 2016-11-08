// Author: Pouya Kary <k@karyfoundation.org> (in case you had any questions...)

import {colors} from "./views/css/colors";
import {Suggestion} from "./plugins/autocompletion_utils/Common";

export interface SortableObject {
    weight: number;
    value: Suggestion;
}

/**
 * Checks if the __key__ exists as a _sequence_ in the __element__.
 */
export function SequenceFilter(element: string, key: string): boolean {
    if ( element.length > 40 ) return false;
    if ( key.length > element.length ) return false;
    let currentSearchCharIndex = 0;

    for (let searchStringsIndex = 0; searchStringsIndex < element.length; searchStringsIndex++) {
        let currentChar = element[searchStringsIndex];
        if ( currentChar === key[ currentSearchCharIndex ] ) {
            if ( currentSearchCharIndex < key.length ) {
                currentSearchCharIndex++;
            }
        }
    }

    return currentSearchCharIndex >= key.length;
}


/**
 * Inserts spans into the sequence to make it colorized.
 */
export function HighlightSequencedSuggestion( element: string, key: string ): string {
    let currentSearchCharIndex = 0;
    let highlightedElement = "";

    for ( let searchStringsIndex = 0; searchStringsIndex < element.length; searchStringsIndex++) {
        let currentChar = element[ searchStringsIndex ];

        if ( currentChar === key[ currentSearchCharIndex ] ) {
            if ( currentSearchCharIndex < key.length ) {
                highlightedElement +=
                    `<span style="color:${colors.blue}">${currentChar}</span>`;
                currentSearchCharIndex++;

            } else { highlightedElement += currentChar; }
        } else { highlightedElement += currentChar; }
    }

    return highlightedElement;
}
