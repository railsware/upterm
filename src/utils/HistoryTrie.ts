import * as _ from "lodash";
import {fuzzyMatch} from "./Common";
import {scan} from "../shell/Scanner";

interface TrieNode {
    value: string;
    occurrences: number;
    children: Map<string, TrieNode>;
}

interface Continuation {
    value: string;
    occurrences: number;
    space: boolean;
}

function untokenize(tokens: string[]): string {
    return tokens.join(" ");
}

function tokenize(string: string) {
    return scan(string).map(token => token.escapedValue);
}

function getContinuation(node: TrieNode): Continuation {
    return {
        value: node.value,
        occurrences: node.occurrences,
        space: node.children.size > 0,
    };
}

export class HistoryTrie {
    private root: TrieNode = {value: "", occurrences: 0, children: new Map()};

    add(input: string | string[], node: TrieNode = this.root) {
        const tokens = (typeof input === "string") ? tokenize(input.trim()) : input;
        const token = tokens[0];

        if (!token) {
            return;
        }

        if (!node.children.has(token)) {
            node.children.set(token, {value: token, occurrences: 0, children: new Map()});
        }

        const value = node.children.get(token)!;
        value.occurrences += 1;
        this.add(tokens.slice(1), value);
    }

    getContinuationsFor(input: string): Continuation[] {
        const tokens = tokenize(input);
        const path = tokens.slice(0, -1);
        const currentToken = tokens[tokens.length - 1];
        const parentNode = this.getNodeAt(path);

        if (!parentNode) {
            return [];
        }

        const continuationNodes: TrieNode[] = [];

        for (let node of parentNode.children.values()) {
            if (fuzzyMatch(currentToken, node.value)) {
                continuationNodes.push(node);
            }
        }

        if (continuationNodes.length === 0) {
            return [];
        }

        const isContinuationNonAmbiguous = continuationNodes.length === 1;

        if (isContinuationNonAmbiguous) {
            const continuationNode = continuationNodes[0];
            const longestNonAmbiguousContinuation = this.getLongestNonAmbiguousPrefix(continuationNode, [continuationNode.value]);
            const continuation = getContinuation(continuationNode);

            if (longestNonAmbiguousContinuation.value !== continuation.value) {
                return [continuation, longestNonAmbiguousContinuation];
            } else {
                return [continuation];
            }
        } else {
            return _.sortBy(continuationNodes, node => -node.occurrences).map(node => getContinuation(node));
        }
    }

    private getNodeAt(path: string[], node: TrieNode = this.root): TrieNode | undefined {
        const token = path[0];

        if (!token) {
            return node;
        }

        if (node.children.has(token)) {
            return this.getNodeAt(path.slice(1), node.children.get(token)!);
        }
    }

    private getLongestNonAmbiguousPrefix(node: TrieNode, path: string[]): Continuation {
        if (node.children.size === 1) {
            const key = node.children.keys().next().value;
            path.push(key);
            return this.getLongestNonAmbiguousPrefix(node.children.get(key)!, path);
        } else {
            const continuation = getContinuation(node);

            return {
                value: untokenize(path),
                occurrences: continuation.occurrences,
                space: continuation.space,
            };
        }
    }
}
