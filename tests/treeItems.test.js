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
const treeItems_1 = require("../treeItems");
const types_1 = require("../storage/types");
const vscode = __importStar(require("vscode"));
suite('TreeItems Test Suite', () => {
    suite('StorageGroupItem', () => {
        test('should create GlobalState group item', () => {
            const item = new treeItems_1.StorageGroupItem(types_1.StorageType.GlobalState, true, 5);
            assert.strictEqual(item.label, 'Global Storage');
            assert.strictEqual(item.description, '(5 items)');
            assert.strictEqual(item.contextValue, 'storageGroup-available');
            assert.ok(item.iconPath instanceof vscode.ThemeIcon);
            assert.strictEqual(item.iconPath.id, 'globe');
        });
        test('should create unavailable File Storage group item', () => {
            const item = new treeItems_1.StorageGroupItem(types_1.StorageType.File, false, 0);
            assert.strictEqual(item.label, 'File Storage');
            assert.strictEqual(item.description, '(Not Available - No Workspace)');
            assert.strictEqual(item.contextValue, 'storageGroup-unavailable');
            assert.strictEqual(item.tooltip, 'File storage requires an open workspace');
        });
        test('should expand when has items', () => {
            const itemWithItems = new treeItems_1.StorageGroupItem(types_1.StorageType.GlobalState, true, 3);
            assert.strictEqual(itemWithItems.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
            const itemWithoutItems = new treeItems_1.StorageGroupItem(types_1.StorageType.GlobalState, true, 0);
            assert.strictEqual(itemWithoutItems.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
        });
    });
    suite('ScrapItem', () => {
        const mockScrap = {
            id: 'test-id',
            label: 'Test Scrap',
            content: '{"test": true}',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        test('should create scrap item with correct properties', () => {
            const item = new treeItems_1.ScrapItem(mockScrap, types_1.StorageType.GlobalState);
            assert.strictEqual(item.label, 'Test Scrap');
            assert.strictEqual(item.id, 'test-id');
            assert.strictEqual(item.content, '{"test": true}');
            assert.strictEqual(item.storageType, types_1.StorageType.GlobalState);
            assert.strictEqual(item.contextValue, 'scrapItem-globalState');
        });
        test('should have edit command', () => {
            const item = new treeItems_1.ScrapItem(mockScrap, types_1.StorageType.File);
            assert.ok(item.command);
            assert.strictEqual(item.command.command, 'scraps.editItem');
            assert.strictEqual(item.command.title, 'Edit');
            assert.deepStrictEqual(item.command.arguments, [item]);
        });
        test('should show time label for old items', () => {
            const oldScrap = {
                ...mockScrap,
                updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            };
            const item = new treeItems_1.ScrapItem(oldScrap, types_1.StorageType.GlobalState);
            assert.strictEqual(item.description, '2h ago');
        });
        test('should not show time label for very recent items', () => {
            const recentScrap = {
                ...mockScrap,
                updatedAt: new Date().toISOString() // just now
            };
            const item = new treeItems_1.ScrapItem(recentScrap, types_1.StorageType.GlobalState);
            assert.strictEqual(item.description, '');
        });
        test('should show yesterday for items from yesterday', () => {
            const yesterdayScrap = {
                ...mockScrap,
                updatedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString() // 30 hours ago
            };
            const item = new treeItems_1.ScrapItem(yesterdayScrap, types_1.StorageType.GlobalState);
            assert.strictEqual(item.description, 'yesterday');
        });
        test('should show days ago for older items', () => {
            const oldScrap = {
                ...mockScrap,
                updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
            };
            const item = new treeItems_1.ScrapItem(oldScrap, types_1.StorageType.GlobalState);
            assert.strictEqual(item.description, '5d ago');
        });
    });
});
//# sourceMappingURL=treeItems.test.js.map