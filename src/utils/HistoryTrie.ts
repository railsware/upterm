interface TrieNode {
    occurrences: number;
    children: Map<string, TrieNode>;
}

function untokenize(tokens: string[]): string {
    return tokens.join(" ");
}

function tokenize(string: string) {
    return string.split(" ");
}

export class HistoryTrie {
    private root: Map<string, TrieNode> = new Map();

    add(input: string | string[], map: Map<string, TrieNode> = this.root) {
        const tokens = (typeof input === "string") ? tokenize(input) : input;
        const token = tokens[0];

        if (!token) {
            return;
        }

        if (!map.has(token)) {
            map.set(token, {occurrences: 0, children: new Map()});
        }

        const value = map.get(token)!;
        value.occurrences += 1;
        this.add(tokens.slice(1), value.children);
    }

    getContinuationsFor(input: string): string[] {
        const tokens = tokenize(input);
        const path = tokens.slice(0, -1);
        const currentToken = tokens[tokens.length - 1];
        const parentNode = this.getNodeAt(path);

        if (!parentNode) {
            return [];
        }

        const continuations: string[] = [];

        for (let key of parentNode.children.keys()) {
            if (key.startsWith(currentToken)) {
                continuations.push(key);
            }
        }

        if (continuations.length === 0) {
            return [];
        }

        const isContinuationNonAmbiguous = continuations.length === 1;

        if (isContinuationNonAmbiguous) {
            const continuation = continuations[0];
            const continuationNode = parentNode.children.get(continuation)!;
            const longestNonAmbiguousPrefix = this.getLongestNonAmbiguousPrefix(continuationNode, [continuation]);

            if (longestNonAmbiguousPrefix !== continuation) {
                return [continuation, longestNonAmbiguousPrefix];
            } else {
                return [continuation];
            }
        } else {
            return continuations;
        }
    }

    private getNodeAt(path: string[], node: TrieNode = {occurrences: 0, children: this.root}): TrieNode | undefined {
        const token = path[0];

        if (!token) {
            return node;
        }

        if (node.children.has(token)) {
            return this.getNodeAt(path.slice(1), node.children.get(token)!);
        }
    }

    private getLongestNonAmbiguousPrefix(node: TrieNode, path: string[]): string {
        if (node.children.size === 1) {
            const key = node.children.keys().next().value;
            path.push(key);
            return this.getLongestNonAmbiguousPrefix(node.children.get(key)!, path);
        } else {
            return untokenize(path);
        }
    }
}
