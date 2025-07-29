import * as assert from 'assert';
import * as vscode from 'vscode';
import { GlobalStateStorageProvider } from '../src/storage/globalStateProvider';
import { ScrapData } from '../src/storage/types';
import { v4 as uuidv4 } from 'uuid';

// Mock vscode.Memento
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

suite('Storage Provider Test Suite', () => {
  
  suite('GlobalStateStorageProvider', () => {
    let provider: GlobalStateStorageProvider;
    let memento: MockMemento;

    setup(() => {
      memento = new MockMemento();
      provider = new GlobalStateStorageProvider(memento as vscode.Memento);
    });

    test('should initialize without error', async () => {
      await provider.initialize();
      assert.ok(true);
    });

    test('should return empty list initially', async () => {
      const items = await provider.list();
      assert.strictEqual(items.length, 0);
    });

    test('should save and retrieve a scrap', async () => {
      const scrap: ScrapData = {
        id: uuidv4(),
        label: 'Test Scrap',
        content: '{"test": true}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await provider.save(scrap);
      const retrieved = await provider.get(scrap.id);
      
      assert.strictEqual(retrieved?.id, scrap.id);
      assert.strictEqual(retrieved?.label, scrap.label);
      assert.strictEqual(retrieved?.content, scrap.content);
    });

    test('should update existing scrap', async () => {
      const scrap: ScrapData = {
        id: uuidv4(),
        label: 'Original',
        content: '{}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await provider.save(scrap);
      await provider.update(scrap.id, { label: 'Updated' });
      
      const updated = await provider.get(scrap.id);
      assert.strictEqual(updated?.label, 'Updated');
    });

    test('should delete a scrap', async () => {
      const scrap: ScrapData = {
        id: uuidv4(),
        label: 'To Delete',
        content: '{}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await provider.save(scrap);
      await provider.delete(scrap.id);
      
      const deleted = await provider.get(scrap.id);
      assert.strictEqual(deleted, null);
    });

    test('should list all scraps', async () => {
      const scrap1: ScrapData = {
        id: uuidv4(),
        label: 'Scrap 1',
        content: '{}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const scrap2: ScrapData = {
        id: uuidv4(),
        label: 'Scrap 2',
        content: '{}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await provider.save(scrap1);
      await provider.save(scrap2);
      
      const items = await provider.list();
      assert.strictEqual(items.length, 2);
    });

    test('should throw error when updating non-existent scrap', async () => {
      try {
        await provider.update('non-existent', { label: 'Test' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('not found'));
      }
    });
  });
});