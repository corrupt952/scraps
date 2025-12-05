import * as vscode from "vscode";
import { StorageProvider, StorageType, ScrapData } from "./types";
import { GlobalStateStorageProvider } from "./globalStateProvider";
import { FileStorageProvider } from "./fileProvider";

export class StorageManager {
  private provider: StorageProvider;
  private initialized = false;

  constructor(
    public readonly context: vscode.ExtensionContext,
    private readonly storageType: StorageType = StorageType.GlobalState,
  ) {
    this.provider = this.createProvider(storageType);
  }

  private createProvider(type: StorageType): StorageProvider {
    switch (type) {
      case StorageType.File: {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          throw new Error("No workspace folder found");
        }
        return new FileStorageProvider(workspaceFolder);
      }
      case StorageType.GlobalState:
      default:
        return new GlobalStateStorageProvider(this.context.globalState);
    }
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.provider.initialize();
      this.initialized = true;
    }
  }

  async switchProvider(type: StorageType): Promise<void> {
    // Get all data from current provider
    const data = await this.provider.list();

    // Create new provider
    const newProvider = this.createProvider(type);
    await newProvider.initialize();

    // Migrate data
    for (const item of data) {
      await newProvider.save(item);
    }

    // Switch provider
    this.provider = newProvider;

    // Save preference
    await this.context.globalState.update("scraps.storageType", type);
  }

  async list(): Promise<ScrapData[]> {
    await this.initialize();
    return this.provider.list();
  }

  async get(id: string): Promise<ScrapData | null> {
    await this.initialize();
    return this.provider.get(id);
  }

  async save(scrap: ScrapData): Promise<void> {
    await this.initialize();
    return this.provider.save(scrap);
  }

  async delete(id: string): Promise<void> {
    await this.initialize();
    return this.provider.delete(id);
  }

  async update(id: string, updates: Partial<ScrapData>): Promise<void> {
    await this.initialize();
    return this.provider.update(id, updates);
  }

  get currentStorageType(): StorageType {
    return this.provider instanceof FileStorageProvider
      ? StorageType.File
      : StorageType.GlobalState;
  }
}
