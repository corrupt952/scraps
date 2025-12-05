import * as assert from "assert";
import { StorageGroupItem, ScrapItem } from "../src/treeItems";
import { StorageType, ScrapData } from "../src/storage/types";
import * as vscode from "vscode";

suite("TreeItems Test Suite", () => {
  suite("StorageGroupItem", () => {
    test("should create GlobalState group item", () => {
      const item = new StorageGroupItem(StorageType.GlobalState, true, 5);

      assert.strictEqual(item.label, "Global Storage");
      assert.strictEqual(item.description, "(5 items)");
      assert.strictEqual(item.contextValue, "storageGroup-available");
      assert.ok(item.iconPath instanceof vscode.ThemeIcon);
      assert.strictEqual((item.iconPath as vscode.ThemeIcon).id, "globe");
    });

    test("should create unavailable File Storage group item", () => {
      const item = new StorageGroupItem(StorageType.File, false, 0);

      assert.strictEqual(item.label, "File Storage");
      assert.strictEqual(item.description, "(Not Available - No Workspace)");
      assert.strictEqual(item.contextValue, "storageGroup-unavailable");
      assert.strictEqual(
        item.tooltip,
        "File storage requires an open workspace",
      );
    });

    test("should expand when has items", () => {
      const itemWithItems = new StorageGroupItem(
        StorageType.GlobalState,
        true,
        3,
      );
      assert.strictEqual(
        itemWithItems.collapsibleState,
        vscode.TreeItemCollapsibleState.Expanded,
      );

      const itemWithoutItems = new StorageGroupItem(
        StorageType.GlobalState,
        true,
        0,
      );
      assert.strictEqual(
        itemWithoutItems.collapsibleState,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
    });
  });

  suite("ScrapItem", () => {
    const mockScrap: ScrapData = {
      id: "test-id",
      label: "Test Scrap",
      content: '{"test": true}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    test("should create scrap item with correct properties", () => {
      const item = new ScrapItem(mockScrap, StorageType.GlobalState);

      assert.strictEqual(item.label, "Test Scrap");
      assert.strictEqual(item.id, "test-id");
      assert.strictEqual(item.content, '{"test": true}');
      assert.strictEqual(item.storageType, StorageType.GlobalState);
      assert.strictEqual(item.contextValue, "scrapItem-globalState");
    });

    test("should have edit command", () => {
      const item = new ScrapItem(mockScrap, StorageType.File);

      assert.ok(item.command);
      assert.strictEqual(item.command.command, "scraps.editItem");
      assert.strictEqual(item.command.title, "Edit");
      assert.deepStrictEqual(item.command.arguments, [item]);
    });

    test("should show time label for old items", () => {
      const oldScrap: ScrapData = {
        ...mockScrap,
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      };

      const item = new ScrapItem(oldScrap, StorageType.GlobalState);
      assert.strictEqual(item.description, "2h ago");
    });

    test("should not show time label for very recent items", () => {
      const recentScrap: ScrapData = {
        ...mockScrap,
        updatedAt: new Date().toISOString(), // just now
      };

      const item = new ScrapItem(recentScrap, StorageType.GlobalState);
      assert.strictEqual(item.description, "");
    });

    test("should show yesterday for items from yesterday", () => {
      const yesterdayScrap: ScrapData = {
        ...mockScrap,
        updatedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
      };

      const item = new ScrapItem(yesterdayScrap, StorageType.GlobalState);
      assert.strictEqual(item.description, "yesterday");
    });

    test("should show days ago for older items", () => {
      const oldScrap: ScrapData = {
        ...mockScrap,
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      };

      const item = new ScrapItem(oldScrap, StorageType.GlobalState);
      assert.strictEqual(item.description, "5d ago");
    });
  });
});
