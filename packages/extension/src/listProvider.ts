import * as vscode from "vscode";
import { MultiStorageManager } from "./storage/multiStorageManager";
import { ScrapData, StorageType } from "./storage/types";
import { StorageGroupItem, ScrapItem } from "./treeItems";

type TreeItem = StorageGroupItem | ScrapItem;

export class ListProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> =
    new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;

  private storageGroups: Map<StorageType, ScrapData[]> = new Map();

  constructor(private readonly storageManager: MultiStorageManager) {
    this.loadItems();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!element) {
      // Root level - return storage groups
      const groups: StorageGroupItem[] = [];

      // Add Global Storage
      const globalItems = this.storageGroups.get(StorageType.GlobalState) || [];
      groups.push(
        new StorageGroupItem(StorageType.GlobalState, true, globalItems.length),
      );

      // Add File Storage (if available)
      const fileItems = this.storageGroups.get(StorageType.File) || [];
      const isFileAvailable = this.storageManager.isAvailable(StorageType.File);
      groups.push(
        new StorageGroupItem(
          StorageType.File,
          isFileAvailable,
          fileItems.length,
        ),
      );

      return groups;
    }

    if (element instanceof StorageGroupItem) {
      // Return items for this storage type
      const items = this.storageGroups.get(element.storageType) || [];
      return items.map((scrap) => new ScrapItem(scrap, element.storageType));
    }

    return [];
  }

  async addItem(
    label: string = "Untitled",
    storageType: StorageType = StorageType.GlobalState,
  ): Promise<void> {
    const now = new Date().toISOString();
    const newScrap: ScrapData = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      label,
      content: "{}",
      createdAt: now,
      updatedAt: now,
    };

    await this.storageManager.saveToType(storageType, newScrap);
    await this.loadItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  async addItemToStorage(
    storageType: StorageType,
    label: string = "Untitled",
  ): Promise<void> {
    await this.storageManager.initialize();
    await this.addItem(label, storageType);
  }

  async renameItem(item: ScrapItem, newLabel: string): Promise<void> {
    await this.storageManager.updateInType(item.storageType, item.id, {
      label: newLabel,
    });
    await this.loadItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  async editItem(item: ScrapItem, content: string): Promise<void> {
    await this.storageManager.updateInType(item.storageType, item.id, {
      content,
    });
    await this.loadItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  async deleteItem(item: ScrapItem): Promise<void> {
    await this.storageManager.deleteFromType(item.storageType, item.id);
    await this.loadItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  refresh(): void {
    this.loadItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  private async loadItems(): Promise<void> {
    try {
      const allItems = await this.storageManager.listAll();

      // Sort each storage type's items by updatedAt
      for (const [, items] of allItems) {
        items.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      }

      this.storageGroups = allItems;
    } catch (error) {
      console.error("Failed to load scraps:", error);
      this.storageGroups.clear();
    }
  }

  // Migration helper for existing data
  async migrateFromOldFormat(): Promise<void> {
    const oldData =
      this.storageManager.context.globalState.get<
        { label: string; content: string }[]
      >("items");
    if (!oldData || oldData.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const migratedScraps: ScrapData[] = oldData.map((item) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      label: item.label,
      content: item.content,
      createdAt: now,
      updatedAt: now,
    }));

    // Save migrated data to GlobalState
    for (const scrap of migratedScraps) {
      await this.storageManager.saveToType(StorageType.GlobalState, scrap);
    }

    // Clear old data
    await this.storageManager.context.globalState.update("items", undefined);

    // Reload items
    await this.loadItems();
    this._onDidChangeTreeData.fire(undefined);
  }

  // Handle workspace changes
  async onWorkspaceFoldersChanged(): Promise<void> {
    await this.storageManager.onWorkspaceFoldersChanged();
    await this.loadItems();
    this._onDidChangeTreeData.fire(undefined);
  }
}

// Re-export ScrapItem for backward compatibility
export { ScrapItem } from "./treeItems";
