import * as assert from 'assert';
import * as vscode from 'vscode';
import { MultiStorageManager } from '../src/storage/multiStorageManager';
import { StorageType, ScrapData } from '../src/storage/types';
import { v4 as uuidv4 } from 'uuid';

// Mock ExtensionContext
class MockExtensionContext {
  globalState = new MockMemento() as vscode.Memento;
  subscriptions: vscode.Disposable[] = [];
  extensionUri = vscode.Uri.file('/test') as vscode.Uri;
  extensionPath = '/test';
  storagePath = '/test/storage';
  globalStoragePath = '/test/globalStorage';
  logPath = '/test/logs';
  asAbsolutePath(relativePath: string): string {
    return `/test/${relativePath}`;
  }
}

class MockMemento {
  private storage = new Map<string, ScrapData[]>();

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.storage.has(key) ? this.storage.get(key) as T : defaultValue;
  }

  async update(key: string, value: ScrapData[]): Promise<void> {
    if (value === undefined) {
      this.storage.delete(key);
    } else {
      this.storage.set(key, value);
    }
  }

  keys(): readonly string[] {
    return Array.from(this.storage.keys());
  }
}

suite('MultiStorageManager Test Suite', () => {
  let manager: MultiStorageManager;
  let context: MockExtensionContext;

  setup(() => {
    context = new MockExtensionContext();
    manager = new MultiStorageManager(context as vscode.ExtensionContext);
  });

  test('should initialize with GlobalState provider', async () => {
    await manager.initialize();
    assert.ok(manager.isAvailable(StorageType.GlobalState));
  });

  test('should list items by type', async () => {
    const items = await manager.listByType(StorageType.GlobalState);
    assert.ok(Array.isArray(items));
  });

  test('should save to specific storage type', async () => {
    const scrap: ScrapData = {
      id: uuidv4(),
      label: 'Test',
      content: '{}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await manager.saveToType(StorageType.GlobalState, scrap);
    const retrieved = await manager.getByType(StorageType.GlobalState, scrap.id);
    
    assert.strictEqual(retrieved?.id, scrap.id);
    assert.strictEqual(retrieved?.label, scrap.label);
  });

  test('should update in specific storage type', async () => {
    const scrap: ScrapData = {
      id: uuidv4(),
      label: 'Original',
      content: '{}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await manager.saveToType(StorageType.GlobalState, scrap);
    await manager.updateInType(StorageType.GlobalState, scrap.id, { label: 'Updated' });
    
    const updated = await manager.getByType(StorageType.GlobalState, scrap.id);
    assert.strictEqual(updated?.label, 'Updated');
  });

  test('should delete from specific storage type', async () => {
    const scrap: ScrapData = {
      id: uuidv4(),
      label: 'To Delete',
      content: '{}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await manager.saveToType(StorageType.GlobalState, scrap);
    await manager.deleteFromType(StorageType.GlobalState, scrap.id);
    
    const deleted = await manager.getByType(StorageType.GlobalState, scrap.id);
    assert.strictEqual(deleted, null);
  });

  test('should list all items from all storages', async () => {
    const scrap: ScrapData = {
      id: uuidv4(),
      label: 'Test',
      content: '{}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await manager.saveToType(StorageType.GlobalState, scrap);
    const allItems = await manager.listAll();
    
    assert.ok(allItems instanceof Map);
    assert.ok(allItems.has(StorageType.GlobalState));
    assert.strictEqual(allItems.get(StorageType.GlobalState)?.length, 1);
  });

  test('should throw error when storage type is not available', async () => {
    try {
      await manager.saveToType(StorageType.File, {
        id: uuidv4(),
        label: 'Test',
        content: '{}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('not available'));
    }
  });
});