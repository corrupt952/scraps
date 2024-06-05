import * as vscode from "vscode";
import { EditorProvider } from "./editorProvider";
import { ListProvider, ScrapItem } from "./listProvider";
import { OldEditorProvider } from "./oldEditorProvider";

export function activate(context: vscode.ExtensionContext) {
  const listProvider = new ListProvider(context.globalState);
  const editorProvider = new EditorProvider(context.extensionUri, listProvider);
  const oldEditorProvider = new OldEditorProvider(context.extensionUri);

  // Commands
  vscode.commands.registerCommand("scraps.addItem", (item: ScrapItem) => {
    listProvider.addItem("Untitled");
  });
  vscode.commands.registerCommand(
    "scraps.renameItem",
    async (item: ScrapItem) => {
      const newName = await vscode.window.showInputBox({
        prompt: "Enter new name",
        value: item.label?.toString(),
      });
      if (newName) {
        listProvider.renameItem(item, newName);
      }
    }
  );
  vscode.commands.registerCommand("scraps.deleteItem", (item: ScrapItem) => {
    listProvider.deleteItem(item);
  });
  vscode.commands.registerCommand("scraps.editItem", (item: ScrapItem) => {
    editorProvider.edit(item);
    editorProvider.refresh();
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
}

// This method is called when your extension is deactivated
export function deactivate() {}
