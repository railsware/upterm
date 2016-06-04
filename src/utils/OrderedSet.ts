export abstract class AbstractOrderedSet<T> {
    constructor(private storageGetter: () => T[], private storageSetter: (t: T[]) => void) {
    }

    prepend(element: T) {
        this.remove(element);
        this.storageSetter([element].concat(this.storageGetter()));
    }

    remove(toRemove: T) {
        this.removeWhere(existing => existing === toRemove);
    }

    removeWhere(removePredicate: (existing: T) => boolean) {
        this.storageSetter(this.storageGetter().filter(path => !removePredicate(path)));
    }

    get size() {
        return this.storageGetter().length;
    }

    at(index: number): T | undefined {
        if (index >= this.size) {
            return undefined;
        } else {
            return this.storageGetter()[index];
        }
    }

    toArray() {
        return this.storageGetter();
    }
}

export class OrderedSet<T> extends AbstractOrderedSet<T> {
    constructor() {
        let storage: T[] = [];
        super(() => storage, updatedStorage => storage = updatedStorage);
    }
}
