class ViewMapLeaf<T> {
  public containerType?: ContainerType;
  public parent: ViewMapLeaf<T>;
  public childs: ViewMapLeaf<T>[];

  private value?: T;

  constructor () {
    this.childs = [];
  }

  public isContainer (): boolean {
    return this.getValue() === undefined;
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

  public remove (leaf: ViewMapLeaf<T>): ViewMapLeaf<T> {
    const parentLeaf = leaf.getParent();

    if (parentLeaf === undefined) { // root
      return leaf;
    } else {

      const leafIndex = parentLeaf.childs.indexOf(leaf);
      parentLeaf.childs.splice(leafIndex, 1);

      if (parentLeaf.childs.length === 0) {
        return this.remove(parentLeaf);
      }

      return parentLeaf.childs[leafIndex];
    }
  }

  public convertToContainer (containerType: ContainerType): T | undefined {
    const previousValue = this.getValue();

    this.removeValue();
    this.containerType = containerType;

    return previousValue;
  }
}

enum ContainerType {
  Row = 1,
  Column = 2
}

export { ViewMapLeaf, ContainerType };
