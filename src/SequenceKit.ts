// Author: Pouya Kary <k@karyfoundation.org> (in case you had any questions...)

import {colors} from './views/css/colors';

/**
 * Checks if the __key__ exists as a _sequence_ in the __element__.
 */
export function SequenceFilter(element: string, key: string): boolean {
    if ( element.length > 40 ) return false;
    var currentSearchCharIndex = 0;
    for (var searchStringsIndex = 0; searchStringsIndex < element.length; searchStringsIndex++) {
        var currentChar = element[searchStringsIndex];
        if ( currentChar == key[ currentSearchCharIndex ] ) {
            if ( currentSearchCharIndex < key.length ) {
                currentSearchCharIndex++;
            }
        }
    }
    if (currentSearchCharIndex >= key.length) {
        return true;
    } else {
        return false;
    }
}


/**
 * Inserts spans into the sequence to make it colorized.
 */
export function HighlightSequencedSuggestion( element: string, key: string ): string {
    console.log(`e --> "${ element }" / k --> "${ key }"`)
    var currentSearchCharIndex = 0;
    var highlightedElement = '';
    for ( var searchStringsIndex = 0; searchStringsIndex < element.length; searchStringsIndex++) {
        var currentChar = element[ searchStringsIndex ];
        if ( currentChar == key[ currentSearchCharIndex ] ) {
            if ( currentSearchCharIndex < key.length ) {
                highlightedElement += `<span style="color:${colors.blue}">${currentChar}</span>`;
                currentSearchCharIndex++;
            } else {
                highlightedElement += currentChar;
            }
        } else {
            highlightedElement += currentChar;
        }
    }
    return highlightedElement;
}