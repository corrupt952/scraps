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
const globalStateProvider_1 = require("../storage/globalStateProvider");
const uuid_1 = require("uuid");
// Mock vscode.Memento
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
suite('Storage Provider Test Suite', () => {
    suite('GlobalStateStorageProvider', () => {
        let provider;
        let memento;
        setup(() => {
            memento = new MockMemento();
            provider = new globalStateProvider_1.GlobalStateStorageProvider(memento);
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
            const scrap = {
                id: (0, uuid_1.v4)(),
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
            const scrap = {
                id: (0, uuid_1.v4)(),
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
            const scrap = {
                id: (0, uuid_1.v4)(),
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
            const scrap1 = {
                id: (0, uuid_1.v4)(),
                label: 'Scrap 1',
                content: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const scrap2 = {
                id: (0, uuid_1.v4)(),
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
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.ok(error.message.includes('not found'));
            }
        });
    });
});
//# sourceMappingURL=storage.test.js.map