import * as vscode from "vscode";
import { ScrapData, StorageProvider } from "./types";

export class GlobalStateStorageProvider implements StorageProvider {
  private readonly key = "scraps.items";

  constructor(private readonly globalState: vscode.Memento) {}

  async initialize(): Promise<void> {}

  async list(): Promise<ScrapData[]> {
    const items = this.globalState.get<ScrapData[]>(this.key) || [];
    return items;
  }

  async get(id: string): Promise<ScrapData | null> {
    const items = await this.list();
    return items.find((item) => item.id === id) || null;
  }

  async save(scrap: ScrapData): Promise<void> {
    const items = await this.list();
    const existingIndex = items.findIndex((item) => item.id === scrap.id);

    if (existingIndex >= 0) {
      items[existingIndex] = scrap;
    } else {
      items.push(scrap);
    }

    await this.globalState.update(this.key, items);
  }

  async delete(id: string): Promise<void> {
    const items = await this.list();
    const filtered = items.filter((item) => item.id !== id);
    await this.globalState.update(this.key, filtered);
  }

  async update(id: string, updates: Partial<ScrapData>): Promise<void> {
    const item = await this.get(id);
    if (!item) {
      throw new Error(`Scrap with id ${id} not found`);
    }

    const updated = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.save(updated);
  }
}
