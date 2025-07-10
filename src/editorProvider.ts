import * as vscode from "vscode";
import { ListProvider, ScrapItem } from "./listProvider";

export class EditorProvider implements vscode.WebviewViewProvider {
  private _item: ScrapItem | undefined;
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly listProvider: ListProvider
  ) {}

  edit(item: ScrapItem) {
    this._item = item;
  }

  refresh() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      if (!this._item) {
        return;
      }

      switch (message.type) {
        case "update":
          const content = JSON.stringify(message.data.message);
          this.listProvider.editItem(this._item, content);
          break;
      }
    });
  }

  _getHtmlForWebview(webview: vscode.Webview) {
    if (!this._item) {
      return this._getEmptyHtml(webview);
    }

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "webview-ui", "dist", "bundle.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "dist",
        "bundle.css"
      )
    );
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet" />
  <title>scraps</title>
</head>
<body>
  <div id="root"></div>
  <script>
    window.initialData = ${JSON.stringify(this._initialData())};
  </script>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>
    `;
  }

  _getEmptyHtml(webview: vscode.Webview) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>scraps</title>
</head>
<body>
  <h1>Select scrap</h1>
</body>
</html>
`;
  }

  _initialData() {
    return { label: this._item?.label, content: this._item?.content };
  }
}
