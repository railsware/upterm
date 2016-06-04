export class OrderedSet<T> {
    private storage: T[] = [];

    prepend(element: T) {
        this.remove(element);
        this.storage.unshift(element);
    }

    remove(toRemove: T) {
        this.removeWhere(existing => existing === toRemove);
    }

    removeWhere(removePredicate: (existing: T) => boolean) {
        this.storage = this.storage.filter(path => !removePredicate(path));
    }

    get size() {
        return this.storage.length;
    }

    at(index: number): T | undefined {
        if (index >= this.storage.length) {
            return undefined;
        } else {
            return this.storage[index];
        }
    }
}
