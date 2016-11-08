// Author: Pouya Kary <k@karyfoundation.org> (in case you had any questions...)

/**
 * Checks if the __key__ exists as a _sequence_ in the __element__.
 */
export function SequenceFilter(element: string, key: string): boolean {
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
export function HighlightedSequencedSuggestion( element: string, key: string ) {
    var currentSearchCharIndex = 0;
    var highlightedElement = '';
    for ( var searchStringsIndex = 0; searchStringsIndex < element.length; searchStringsIndex++) {
        var currentChar = element[ searchStringsIndex ];
        if ( currentChar == key[ currentSearchCharIndex ] ) {
            if ( currentSearchCharIndex < key.length ) {
                highlightedElement += '<b>' + currentChar + '</b>';
                currentSearchCharIndex++;
            } else {
                highlightedElement += currentChar;
            }
        } else {
            highlightedElement += currentChar;
        }
    }
    if ( currentSearchCharIndex >= key.length ) {
        return highlightedElement;
    }
}