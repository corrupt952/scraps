"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const multiStorageManager_1 = require("../storage/multiStorageManager");
const types_1 = require("../storage/types");
const uuid_1 = require("uuid");
// Mock ExtensionContext
class MockExtensionContext {
    globalState = new MockMemento();
    subscriptions = [];
    extensionUri = vscode.Uri.file('/test');
    extensionPath = '/test';
    storagePath = '/test/storage';
    globalStoragePath = '/test/globalStorage';
    logPath = '/test/logs';
    asAbsolutePath(relativePath) {
        return `/test/${relativePath}`;
    }
}
class MockMemento {
    storage = new Map();
    get(key, defaultValue) {
        return this.storage.has(key) ? this.storage.get(key) : defaultValue;
    }
    async update(key, value) {
        if (value === undefined) {
            this.storage.delete(key);
        }
        else {
            this.storage.set(key, value);
        }
    }
    keys() {
        return Array.from(this.storage.keys());
    }
}
suite('MultiStorageManager Test Suite', () => {
    let manager;
    let context;
    setup(() => {
        context = new MockExtensionContext();
        manager = new multiStorageManager_1.MultiStorageManager(context);
    });
    test('should initialize with GlobalState provider', async () => {
        await manager.initialize();
        assert.ok(manager.isAvailable(types_1.StorageType.GlobalState));
    });
    test('should list items by type', async () => {
        const items = await manager.listByType(types_1.StorageType.GlobalState);
        assert.ok(Array.isArray(items));
    });
    test('should save to specific storage type', async () => {
        const scrap = {
            id: (0, uuid_1.v4)(),
            label: 'Test',
            content: '{}',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await manager.saveToType(types_1.StorageType.GlobalState, scrap);
        const retrieved = await manager.getByType(types_1.StorageType.GlobalState, scrap.id);
        assert.strictEqual(retrieved?.id, scrap.id);
        assert.strictEqual(retrieved?.label, scrap.label);
    });
    test('should update in specific storage type', async () => {
        const scrap = {
            id: (0, uuid_1.v4)(),
            label: 'Original',
            content: '{}',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await manager.saveToType(types_1.StorageType.GlobalState, scrap);
        await manager.updateInType(types_1.StorageType.GlobalState, scrap.id, { label: 'Updated' });
        const updated = await manager.getByType(types_1.StorageType.GlobalState, scrap.id);
        assert.strictEqual(updated?.label, 'Updated');
    });
    test('should delete from specific storage type', async () => {
        const scrap = {
            id: (0, uuid_1.v4)(),
            label: 'To Delete',
            content: '{}',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await manager.saveToType(types_1.StorageType.GlobalState, scrap);
        await manager.deleteFromType(types_1.StorageType.GlobalState, scrap.id);
        const deleted = await manager.getByType(types_1.StorageType.GlobalState, scrap.id);
        assert.strictEqual(deleted, null);
    });
    test('should list all items from all storages', async () => {
        const scrap = {
            id: (0, uuid_1.v4)(),
            label: 'Test',
            content: '{}',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await manager.saveToType(types_1.StorageType.GlobalState, scrap);
        const allItems = await manager.listAll();
        assert.ok(allItems instanceof Map);
        assert.ok(allItems.has(types_1.StorageType.GlobalState));
        assert.strictEqual(allItems.get(types_1.StorageType.GlobalState)?.length, 1);
    });
    test('should throw error when storage type is not available', async () => {
        try {
            await manager.saveToType(types_1.StorageType.File, {
                id: (0, uuid_1.v4)(),
                label: 'Test',
                content: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            assert.fail('Should have thrown error');
        }
        catch (error) {
            assert.ok(error instanceof Error);
            assert.ok(error.message.includes('not available'));
        }
    });
});
//# sourceMappingURL=multiStorageManager.test.js.map