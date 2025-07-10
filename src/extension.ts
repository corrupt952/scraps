import * as vscode from "vscode";
import { EditorProvider } from "./editorProvider";
import { ListProvider, ScrapItem } from "./listProvider";
import { OldEditorProvider } from "./oldEditorProvider";
import { MultiStorageManager } from "./storage/multiStorageManager";

export function activate(context: vscode.ExtensionContext) {
  const storageManager = new MultiStorageManager(context);
  
  const listProvider = new ListProvider(storageManager);
  const editorProvider = new EditorProvider(context.extensionUri, listProvider);
  const oldEditorProvider = new OldEditorProvider(context.extensionUri);

  // Auto-migrate old data if needed
  listProvider.migrateFromOldFormat().catch(error => {
    console.error("Failed to migrate old data:", error);
  });

  // Commands
  vscode.commands.registerCommand("scraps.addItem", async () => {
    await listProvider.addItem("Untitled");
  });
  
  vscode.commands.registerCommand(
    "scraps.renameItem",
    async (item: ScrapItem) => {
      const currentLabel = item.label?.toString() || "";
      const labelWithoutTime = currentLabel.replace(/\s+\([^)]+\)$/, "");
      
      const newName = await vscode.window.showInputBox({
        prompt: "Enter new name",
        value: labelWithoutTime,
      });
      if (newName) {
        await listProvider.renameItem(item, newName);
      }
    }
  );
  
  vscode.commands.registerCommand("scraps.deleteItem", async (item: ScrapItem) => {
    const confirm = await vscode.window.showWarningMessage(
      `Delete "${item.label}"?`,
      "Delete",
      "Cancel"
    );
    if (confirm === "Delete") {
      await listProvider.deleteItem(item);
    }
  });
  
  vscode.commands.registerCommand("scraps.editItem", (item: ScrapItem) => {
    editorProvider.edit(item);
    editorProvider.refresh();
  });
  
  vscode.commands.registerCommand("scraps.refreshList", () => {
    listProvider.refresh();
  });
  

  vscode.commands.registerCommand("scraps.migrateData", async () => {
    try {
      await listProvider.migrateFromOldFormat();
      vscode.window.showInformationMessage("Data migration completed");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to migrate data: ${error}`);
    }
  });
  

  vscode.commands.registerCommand("scraps.addToStorage", async (item) => {
    if (!item || !item.storageType) {
      return;
    }
    
    const name = await vscode.window.showInputBox({
      prompt: "Enter scrap name",
      value: "Untitled"
    });
    
    if (name !== undefined) {
      try {
        await listProvider.addItemToStorage(item.storageType, name || "Untitled");
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to add scrap: ${error}`);
      }
    }
  });

  // Views
  const listView = vscode.window.createTreeView("scraps.list", {
    treeDataProvider: listProvider,
  });
  context.subscriptions.push(listView);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("scraps.editor", editorProvider)
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "scraps.oldEditor",
      oldEditorProvider
    )
  );

  // Listen for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      listProvider.onWorkspaceFoldersChanged();
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
