import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { GlobalStateStorageProvider } from "../src/storage/globalStateProvider";
import { FileStorageProvider } from "../src/storage/fileProvider";
import { ScrapData } from "../src/storage/types";
import { v4 as uuidv4 } from "uuid";

// Mock vscode.Memento
class MockMemento {
  private storage = new Map<string, ScrapData[]>();

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.storage.has(key) ? (this.storage.get(key) as T) : defaultValue;
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

suite("Storage Provider Test Suite", () => {
  suite("GlobalStateStorageProvider", () => {
    let provider: GlobalStateStorageProvider;
    let memento: MockMemento;

    setup(() => {
      memento = new MockMemento();
      provider = new GlobalStateStorageProvider(memento as vscode.Memento);
    });

    test("should initialize without error", async () => {
      await provider.initialize();
      assert.ok(true);
    });

    test("should return empty list initially", async () => {
      const items = await provider.list();
      assert.strictEqual(items.length, 0);
    });

    test("should save and retrieve a scrap", async () => {
      const scrap: ScrapData = {
        id: uuidv4(),
        label: "Test Scrap",
        content: '{"test": true}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await provider.save(scrap);
      const retrieved = await provider.get(scrap.id);

      assert.strictEqual(retrieved?.id, scrap.id);
      assert.strictEqual(retrieved?.label, scrap.label);
      assert.strictEqual(retrieved?.content, scrap.content);
    });

    test("should update existing scrap", async () => {
      const scrap: ScrapData = {
        id: uuidv4(),
        label: "Original",
        content: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await provider.save(scrap);
      await provider.update(scrap.id, { label: "Updated" });

      const updated = await provider.get(scrap.id);
      assert.strictEqual(updated?.label, "Updated");
    });

    test("should delete a scrap", async () => {
      const scrap: ScrapData = {
        id: uuidv4(),
        label: "To Delete",
        content: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await provider.save(scrap);
      await provider.delete(scrap.id);

      const deleted = await provider.get(scrap.id);
      assert.strictEqual(deleted, null);
    });

    test("should list all scraps", async () => {
      const scrap1: ScrapData = {
        id: uuidv4(),
        label: "Scrap 1",
        content: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const scrap2: ScrapData = {
        id: uuidv4(),
        label: "Scrap 2",
        content: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await provider.save(scrap1);
      await provider.save(scrap2);

      const items = await provider.list();
      assert.strictEqual(items.length, 2);
    });

    test("should throw error when updating non-existent scrap", async () => {
      try {
        await provider.update("non-existent", { label: "Test" });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes("not found"));
      }
    });
  });

  suite("FileStorageProvider - Lazy Initialization", () => {
    let provider: FileStorageProvider;
    let tempDir: string;
    let scrapsDir: string;
    let mockWorkspaceFolder: vscode.WorkspaceFolder;

    setup(async () => {
      // Create a unique temp directory for each test
      tempDir = path.join(
        os.tmpdir(),
        `scraps-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      scrapsDir = path.join(tempDir, ".scraps");

      // Mock WorkspaceFolder
      mockWorkspaceFolder = {
        uri: vscode.Uri.file(tempDir),
        name: "test-workspace",
        index: 0,
      };

      provider = new FileStorageProvider(mockWorkspaceFolder);
    });

    teardown(async () => {
      // Clean up temp directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    test("should NOT create directory on initialize()", async () => {
      await provider.initialize();

      // Directory should NOT exist
      try {
        await fs.access(scrapsDir);
        assert.fail(".scraps directory should not exist after initialize()");
      } catch {
        // Expected: directory does not exist
        assert.ok(true);
      }
    });

    test("should NOT create directory on list()", async () => {
      await provider.initialize();
      const items = await provider.list();

      // Should return empty array
      assert.deepStrictEqual(items, []);

      // Directory should still NOT exist
      try {
        await fs.access(scrapsDir);
        assert.fail(".scraps directory should not exist after list()");
      } catch {
        // Expected: directory does not exist
        assert.ok(true);
      }
    });

    test("should create directory on first save()", async () => {
      await provider.initialize();

      const scrap: ScrapData = {
        id: uuidv4(),
        label: "Test Scrap",
        content: '{"test": true}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await provider.save(scrap);

      // Directory should now exist
      try {
        await fs.access(scrapsDir);
        assert.ok(true, ".scraps directory should exist after save()");
      } catch {
        assert.fail(".scraps directory should exist after save()");
      }

      // index.json should exist
      const indexPath = path.join(scrapsDir, "index.json");
      try {
        await fs.access(indexPath);
        assert.ok(true, "index.json should exist");
      } catch {
        assert.fail("index.json should exist after save()");
      }

      // Scrap file should exist
      const scrapFile = path.join(scrapsDir, `${scrap.id}.json`);
      try {
        await fs.access(scrapFile);
        assert.ok(true, "Scrap file should exist");
      } catch {
        assert.fail("Scrap file should exist after save()");
      }
    });

    test("should create .gitignore with .scraps entry on first save()", async () => {
      await provider.initialize();

      const scrap: ScrapData = {
        id: uuidv4(),
        label: "Test",
        content: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await provider.save(scrap);

      // .gitignore should exist and contain .scraps
      const gitignorePath = path.join(tempDir, ".gitignore");
      const gitignoreContent = await fs.readFile(gitignorePath, "utf8");
      assert.ok(
        gitignoreContent.includes(".scraps"),
        ".gitignore should contain .scraps",
      );
    });

    test("should append to existing .gitignore on first save()", async () => {
      // Create existing .gitignore
      const gitignorePath = path.join(tempDir, ".gitignore");
      await fs.writeFile(gitignorePath, "node_modules/\n.env\n");

      await provider.initialize();

      const scrap: ScrapData = {
        id: uuidv4(),
        label: "Test",
        content: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await provider.save(scrap);

      // .gitignore should contain both original content and .scraps
      const gitignoreContent = await fs.readFile(gitignorePath, "utf8");
      assert.ok(
        gitignoreContent.includes("node_modules/"),
        "Should preserve original content",
      );
      assert.ok(gitignoreContent.includes(".scraps"), "Should add .scraps");
    });

    test("should detect existing directory on initialize()", async () => {
      // Pre-create the .scraps directory
      await fs.mkdir(scrapsDir, { recursive: true });
      await fs.writeFile(path.join(scrapsDir, "index.json"), "[]");

      await provider.initialize();

      // list() should work without creating directory again
      const items = await provider.list();
      assert.deepStrictEqual(items, []);
    });

    test("should retrieve saved scrap after save()", async () => {
      await provider.initialize();

      const scrap: ScrapData = {
        id: uuidv4(),
        label: "Test Scrap",
        content: '{"data": "test"}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await provider.save(scrap);
      const retrieved = await provider.get(scrap.id);

      assert.strictEqual(retrieved?.id, scrap.id);
      assert.strictEqual(retrieved?.label, scrap.label);
      assert.strictEqual(retrieved?.content, scrap.content);
    });
  });
});
