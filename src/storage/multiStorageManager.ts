import * as vscode from "vscode";
import { StorageProvider, StorageType, ScrapData } from "./types";
import { GlobalStateStorageProvider } from "./globalStateProvider";
import { FileStorageProvider } from "./fileProvider";

export class MultiStorageManager {
  private providers: Map<StorageType, StorageProvider> = new Map();
  private initialized = false;

  constructor(public readonly context: vscode.ExtensionContext) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Always initialize GlobalState provider
    this.providers.set(
      StorageType.GlobalState,
      new GlobalStateStorageProvider(this.context.globalState),
    );

    // Try to initialize File provider if workspace is available
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      this.providers.set(
        StorageType.File,
        new FileStorageProvider(workspaceFolder),
      );
    }
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      // Initialize all available providers
      for (const [type, provider] of this.providers) {
        try {
          await provider.initialize();
        } catch (error) {
          console.error(`Failed to initialize ${type} provider:`, error);
        }
      }
      this.initialized = true;
    }
  }

  async listByType(type: StorageType): Promise<ScrapData[]> {
    await this.initialize();
    const provider = this.providers.get(type);
    if (!provider) {
      return [];
    }

    try {
      return await provider.list();
    } catch (error) {
      console.error(`Failed to list items from ${type}:`, error);
      return [];
    }
  }

  async listAll(): Promise<Map<StorageType, ScrapData[]>> {
    await this.initialize();
    const result = new Map<StorageType, ScrapData[]>();

    for (const [type, provider] of this.providers) {
      try {
        const items = await provider.list();
        result.set(type, items);
      } catch (error) {
        console.error(`Failed to list items from ${type}:`, error);
        result.set(type, []);
      }
    }

    return result;
  }

  async getByType(type: StorageType, id: string): Promise<ScrapData | null> {
    await this.initialize();
    const provider = this.providers.get(type);
    if (!provider) {
      return null;
    }
    return provider.get(id);
  }

  async saveToType(type: StorageType, scrap: ScrapData): Promise<void> {
    await this.initialize();
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Storage type ${type} is not available`);
    }
    return provider.save(scrap);
  }

  async deleteFromType(type: StorageType, id: string): Promise<void> {
    await this.initialize();
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Storage type ${type} is not available`);
    }
    return provider.delete(id);
  }

  async updateInType(
    type: StorageType,
    id: string,
    updates: Partial<ScrapData>,
  ): Promise<void> {
    await this.initialize();
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Storage type ${type} is not available`);
    }
    return provider.update(id, updates);
  }

  isAvailable(type: StorageType): boolean {
    return this.providers.has(type);
  }

  getAvailableStorages(): StorageType[] {
    return Array.from(this.providers.keys());
  }

  // Workspace change handler
  async onWorkspaceFoldersChanged(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (workspaceFolder && !this.providers.has(StorageType.File)) {
      // Workspace added, initialize file provider
      const fileProvider = new FileStorageProvider(workspaceFolder);
      await fileProvider.initialize();
      this.providers.set(StorageType.File, fileProvider);
    } else if (!workspaceFolder && this.providers.has(StorageType.File)) {
      // Workspace removed, remove file provider
      this.providers.delete(StorageType.File);
    }
  }
}
