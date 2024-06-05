import * as vscode from "vscode";

export class ListProvider implements vscode.TreeDataProvider<ScrapItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ScrapItem | undefined> =
    new vscode.EventEmitter<ScrapItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ScrapItem | undefined> =
    this._onDidChangeTreeData.event;

  private items: ScrapItem[] = [];

  constructor(private readonly globalState: vscode.Memento) {
    this.loadItems();
  }

  getTreeItem(element: ScrapItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ScrapItem): Thenable<ScrapItem[]> {
    if (element === undefined) {
      return Promise.resolve(this.items);
    }
    return Promise.resolve([]);
  }

  addItem(label: string) {
    const newItem = new ScrapItem(
      label,
      "{}",
      vscode.TreeItemCollapsibleState.None
    );
    this.items.push(newItem);
    this.saveItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  renameItem(item: ScrapItem, label: string) {
    item.label = label;
    this.saveItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  editItem(item: ScrapItem, content: string) {
    item.content = content;
    this.saveItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  deleteItem(item: ScrapItem) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.saveItems();
      this._onDidChangeTreeData.fire(undefined);
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  private saveItems() {
    const data = this.items.map((item) => ({
      label: item.label,
      content: item.content,
    }));
    this.globalState.update("items", data);
  }

  private loadItems() {
    const items =
      this.globalState.get<{ label: string; content: string }[]>("items") || [];
    this.items = Array.from(items, ({ label, content }) => {
      return new ScrapItem(
        label,
        content,
        vscode.TreeItemCollapsibleState.None
      );
    });
  }
}

export class ScrapItem extends vscode.TreeItem {
  public content: string = "";

  constructor(
    label: string,
    content: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.content = content;
    this.iconPath = new vscode.ThemeIcon("note");
    this.command = {
      command: "scraps.editItem",
      title: "Edit",
      arguments: [this],
    };
  }
}
