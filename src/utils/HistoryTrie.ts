interface TrieNode {
    value: string;
    occurrences: number;
    children: Map<string, TrieNode>;
}

function untokenize(tokens: string[]): string {
    return tokens.join(" ");
}

function tokenize(string: string) {
    return string.split(" ");
}

function getFormattedValue(node: TrieNode) {
    return node.value + (node.children.size ? " " : "");
}

export class HistoryTrie {
    private root: Map<string, TrieNode> = new Map();

    add(input: string | string[], map: Map<string, TrieNode> = this.root) {
        const tokens = (typeof input === "string") ? tokenize(input.trim()) : input;
        const token = tokens[0];

        if (!token) {
            return;
        }

        if (!map.has(token)) {
            map.set(token, {value: token, occurrences: 0, children: new Map()});
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

        const continuationNodes: TrieNode[] = [];

        for (let node of parentNode.children.values()) {
            if (node.value.startsWith(currentToken)) {
                continuationNodes.push(node);
            }
        }

        if (continuationNodes.length === 0) {
            return [];
        }

        const isContinuationNonAmbiguous = continuationNodes.length === 1;

        if (isContinuationNonAmbiguous) {
            const continuationNode = continuationNodes[0];
            const longestNonAmbiguousPrefix = this.getLongestNonAmbiguousPrefix(continuationNode, [continuationNode.value]);
            const formattedValue = getFormattedValue(continuationNode);

            if (longestNonAmbiguousPrefix !== formattedValue) {
                return [formattedValue, longestNonAmbiguousPrefix];
            } else {
                return [formattedValue];
            }
        } else {
            return continuationNodes.map(node => getFormattedValue(node));
        }
    }

    private getNodeAt(path: string[], node: TrieNode = {value: "", occurrences: 0, children: this.root}): TrieNode | undefined {
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
            return untokenize(path) + (node.children.size ? " " : "");
        }
    }
}
