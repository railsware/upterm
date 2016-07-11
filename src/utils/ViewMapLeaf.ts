class ViewMapLeaf<T> {
  public containerType?: ContainerType;
  public parent: ViewMapLeaf<T>;
  public childs: ViewMapLeaf<T>[];

  private value?: T;

  constructor () {
    this.childs = [];
  }

  public setValue (value: T | undefined) {
    this.value = value;
  }

  public getValue () {
    return this.value;
  }

  public removeValue () {
    this.value = undefined;
  }

  public getParent () {
    return this.parent;
  }

  public addLeaf (value: T | undefined) {
    const newLeaf = new ViewMapLeaf<T>();
    newLeaf.setValue(value);
    newLeaf.parent = this;

    this.childs.push(newLeaf);

    return newLeaf;
  }

  public addNeighborLeaf (value: T | undefined, currentLeaf: ViewMapLeaf<T>) {
    const newLeaf = new ViewMapLeaf<T>();
    newLeaf.setValue(value);
    newLeaf.parent = this;

    const currentLeafIndex = this.childs.indexOf(currentLeaf);
    this.childs.splice(currentLeafIndex + 1, 0, newLeaf);

    return newLeaf;
  }

  public find (value: T): (ViewMapLeaf<T> | void) {
    if (this.value === value)
      return this;

    for (let i = 0; i < this.childs.length; i++) {
      const foundValue = this.childs[i].find(value);
      if (foundValue) {
        return foundValue;
      }
    }
  }
}

enum ContainerType {
  Row = 1,
  Column = 2
}

export { ViewMapLeaf, ContainerType };
