import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { activate, deactivate } from "../src/extension";
import { StorageType } from "../src/storage/types";

suite("Extension Test Suite", () => {
  let sandbox: sinon.SinonSandbox;
  let context: vscode.ExtensionContext;
  let globalState: vscode.Memento;
  let registerCommandStub: sinon.SinonStub;
  let createTreeViewStub: sinon.SinonStub;
  let registerWebviewViewProviderStub: sinon.SinonStub;
  let showInputBoxStub: sinon.SinonStub;
  let showWarningMessageStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  let showErrorMessageStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();

    // Mock globalState
    globalState = {
      get: sandbox.stub().returns(undefined),
      update: sandbox.stub().resolves(),
      keys: sandbox.stub().returns([]),
      setKeysForSync: sandbox.stub(),
    } as vscode.Memento & { setKeysForSync(keys: readonly string[]): void };

    // Mock context
    context = {
      subscriptions: [],
      globalState,
      extensionUri: vscode.Uri.file("/test"),
      extensionPath: "/test",
      storagePath: undefined,
      globalStoragePath: "/test/global",
      logPath: "/test/logs",
      asAbsolutePath: (path: string) => `/test/${path}`,
      workspaceState: {} as any,
      secrets: {} as any,
      environmentVariableCollection: {} as any,
      storageUri: undefined,
      globalStorageUri: vscode.Uri.file("/test/global"),
      logUri: vscode.Uri.file("/test/logs"),
      extensionMode: vscode.ExtensionMode.Test,
      extension: {} as any,
      languageModelAccessInformation: {} as any,
    } as unknown as vscode.ExtensionContext;

    // Stub vscode API methods
    registerCommandStub = sandbox.stub(vscode.commands, "registerCommand");
    createTreeViewStub = sandbox.stub(vscode.window, "createTreeView");
    registerWebviewViewProviderStub = sandbox.stub(
      vscode.window,
      "registerWebviewViewProvider",
    );
    showInputBoxStub = sandbox.stub(vscode.window, "showInputBox");
    showWarningMessageStub = sandbox.stub(vscode.window, "showWarningMessage");
    showInformationMessageStub = sandbox.stub(
      vscode.window,
      "showInformationMessage",
    );
    showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");

    // Mock workspace
    sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);
    sandbox.stub(vscode.workspace, "onDidChangeWorkspaceFolders").returns({
      dispose: sandbox.stub(),
    });
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should activate extension and register all commands", () => {
    activate(context);

    // Verify all commands are registered
    assert.ok(registerCommandStub.calledWith("scraps.addItem"));
    assert.ok(registerCommandStub.calledWith("scraps.renameItem"));
    assert.ok(registerCommandStub.calledWith("scraps.deleteItem"));
    assert.ok(registerCommandStub.calledWith("scraps.editItem"));
    assert.ok(registerCommandStub.calledWith("scraps.refreshList"));
    assert.ok(registerCommandStub.calledWith("scraps.migrateData"));
    assert.ok(registerCommandStub.calledWith("scraps.addToStorage"));

    assert.strictEqual(registerCommandStub.callCount, 7);
  });

  test("should create tree view with correct id", () => {
    activate(context);

    assert.ok(createTreeViewStub.calledOnce);
    assert.ok(
      createTreeViewStub.calledWithMatch("scraps.list", {
        treeDataProvider: sinon.match.object,
      }),
    );
  });

  test("should register webview providers", () => {
    activate(context);

    assert.ok(registerWebviewViewProviderStub.calledOnce);
    assert.ok(
      registerWebviewViewProviderStub.calledWithMatch(
        "scraps.editor",
        sinon.match.object,
      ),
    );
  });

  test("should add disposables to context subscriptions", () => {
    activate(context);

    // Should have at least:
    // - 1 tree view
    // - 1 webview provider
    // - 1 workspace folder change listener
    assert.ok(context.subscriptions.length >= 3);
  });

  test("addItem command should create new untitled item", async () => {
    activate(context);

    const addItemHandler =
      registerCommandStub.withArgs("scraps.addItem").firstCall.args[1];
    await addItemHandler();

    // Command should execute without error
    assert.ok(true);
  });

  test("renameItem command should show input box and rename item", async () => {
    showInputBoxStub.resolves("New Name");

    // Mock globalState to return saved items
    (globalState.get as sinon.SinonStub).returns([
      {
        id: "test-id",
        label: "Old Name",
        content: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    activate(context);

    const renameHandler =
      registerCommandStub.withArgs("scraps.renameItem").firstCall.args[1];
    const mockItem = {
      label: "Old Name",
      id: "test-id",
      content: "{}",
      storageType: StorageType.GlobalState,
    };

    await renameHandler(mockItem);

    assert.ok(showInputBoxStub.calledOnce);
    assert.ok(
      showInputBoxStub.calledWithMatch({
        prompt: "Enter new name",
        value: "Old Name",
      }),
    );

    // Verify update was called
    assert.ok((globalState.update as sinon.SinonStub).called);
  });

  test("renameItem command should handle cancel", async () => {
    showInputBoxStub.resolves(undefined);
    activate(context);

    const renameHandler =
      registerCommandStub.withArgs("scraps.renameItem").firstCall.args[1];
    const mockItem = {
      label: "Test Item",
      id: "test-id",
      content: "{}",
      storageType: StorageType.GlobalState,
    };

    await renameHandler(mockItem);

    assert.ok(showInputBoxStub.calledOnce);
  });

  test("deleteItem command should show confirmation and delete on confirm", async () => {
    showWarningMessageStub.resolves("Delete");

    // Mock globalState to return saved items
    (globalState.get as sinon.SinonStub).returns([
      {
        id: "test-id",
        label: "Test Item",
        content: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    activate(context);

    const deleteHandler =
      registerCommandStub.withArgs("scraps.deleteItem").firstCall.args[1];
    const mockItem = {
      label: "Test Item",
      id: "test-id",
      content: "{}",
      storageType: StorageType.GlobalState,
    };

    await deleteHandler(mockItem);

    assert.ok(showWarningMessageStub.calledOnce);
    assert.ok(
      showWarningMessageStub.calledWithMatch(
        'Delete "Test Item"?',
        "Delete",
        "Cancel",
      ),
    );

    // Verify update was called
    assert.ok((globalState.update as sinon.SinonStub).called);
  });

  test("deleteItem command should handle cancel", async () => {
    showWarningMessageStub.resolves("Cancel");
    activate(context);

    const deleteHandler =
      registerCommandStub.withArgs("scraps.deleteItem").firstCall.args[1];
    const mockItem = {
      label: "Test Item",
      id: "test-id",
      content: "{}",
      storageType: StorageType.GlobalState,
    };

    await deleteHandler(mockItem);

    assert.ok(showWarningMessageStub.calledOnce);
  });

  test("editItem command should trigger editor", () => {
    activate(context);

    const editHandler =
      registerCommandStub.withArgs("scraps.editItem").firstCall.args[1];
    const mockItem = {
      label: "Test Item",
      id: "test-id",
      content: "{}",
      storageType: StorageType.GlobalState,
    };

    editHandler(mockItem);

    // Command should execute without error
    assert.ok(true);
  });

  test("refreshList command should trigger refresh", () => {
    activate(context);

    const refreshHandler =
      registerCommandStub.withArgs("scraps.refreshList").firstCall.args[1];
    refreshHandler();

    // Command should execute without error
    assert.ok(true);
  });

  test("migrateData command should show success message", async () => {
    activate(context);

    const migrateHandler =
      registerCommandStub.withArgs("scraps.migrateData").firstCall.args[1];
    await migrateHandler();

    assert.ok(showInformationMessageStub.calledOnce);
    assert.ok(
      showInformationMessageStub.calledWithMatch("Data migration completed"),
    );
  });

  test("addToStorage command should handle invalid item", async () => {
    activate(context);

    const addToStorageHandler = registerCommandStub.withArgs(
      "scraps.addToStorage",
    ).firstCall.args[1];

    // Test with no item
    await addToStorageHandler(undefined);

    // Test with item without storageType
    await addToStorageHandler({});

    // Should not show any dialogs
    assert.strictEqual(showInputBoxStub.callCount, 0);
  });

  test("addToStorage command should show input box for valid item", async () => {
    showInputBoxStub.resolves("My New Scrap");

    // Mock globalState for storage operations
    (globalState.get as sinon.SinonStub).returns([]);

    activate(context);

    const addToStorageHandler = registerCommandStub.withArgs(
      "scraps.addToStorage",
    ).firstCall.args[1];
    const mockItem = {
      storageType: StorageType.GlobalState,
    };

    await addToStorageHandler(mockItem);

    assert.ok(showInputBoxStub.calledOnce);
    assert.ok(
      showInputBoxStub.calledWithMatch({
        prompt: "Enter scrap name",
        value: "Untitled",
      }),
    );

    // Verify update was called to save the new scrap
    assert.ok((globalState.update as sinon.SinonStub).called);
  });

  test("addToStorage command should handle cancel", async () => {
    showInputBoxStub.resolves(undefined);

    // Mock globalState for storage operations
    (globalState.get as sinon.SinonStub).returns([]);

    activate(context);

    const addToStorageHandler = registerCommandStub.withArgs(
      "scraps.addToStorage",
    ).firstCall.args[1];
    const mockItem = {
      storageType: StorageType.GlobalState,
    };

    await addToStorageHandler(mockItem);

    assert.ok(showInputBoxStub.calledOnce);
    assert.strictEqual(showErrorMessageStub.callCount, 0);

    // Verify update was NOT called when cancelled
    assert.strictEqual((globalState.update as sinon.SinonStub).callCount, 0);
  });

  test("deactivate should complete without error", () => {
    deactivate();

    // Should not throw
    assert.ok(true);
  });
});
