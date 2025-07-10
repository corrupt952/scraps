import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { ScrapData, StorageProvider } from "./types";

export class FileStorageProvider implements StorageProvider {
  private readonly scrapsDir = ".scraps";
  private readonly indexFile = "index.json";
  private scrapsPath: string;
  private indexPath: string;

  constructor(private readonly workspaceFolder: vscode.WorkspaceFolder) {
    this.scrapsPath = path.join(workspaceFolder.uri.fsPath, this.scrapsDir);
    this.indexPath = path.join(this.scrapsPath, this.indexFile);
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.scrapsPath, { recursive: true });
      
      // Create index file if it doesn't exist
      try {
        await fs.access(this.indexPath);
      } catch {
        await fs.writeFile(this.indexPath, JSON.stringify([], null, 2));
      }
      
      // Add .scraps to .gitignore if it doesn't exist
      const gitignorePath = path.join(this.workspaceFolder.uri.fsPath, ".gitignore");
      try {
        const gitignoreContent = await fs.readFile(gitignorePath, "utf8");
        if (!gitignoreContent.includes(this.scrapsDir)) {
          await fs.appendFile(gitignorePath, `\n# Scraps local notes\n${this.scrapsDir}/\n`);
        }
      } catch {
        // .gitignore doesn't exist, create it
        await fs.writeFile(gitignorePath, `# Scraps local notes\n${this.scrapsDir}/\n`);
      }
    } catch (error) {
      throw new Error(`Failed to initialize file storage: ${error}`);
    }
  }

  async list(): Promise<ScrapData[]> {
    try {
      const content = await fs.readFile(this.indexPath, "utf8");
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async get(id: string): Promise<ScrapData | null> {
    const items = await this.list();
    return items.find(item => item.id === id) || null;
  }

  async save(scrap: ScrapData): Promise<void> {
    const items = await this.list();
    const existingIndex = items.findIndex(item => item.id === scrap.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = scrap;
    } else {
      items.push(scrap);
    }
    
    const scrapFile = path.join(this.scrapsPath, `${scrap.id}.json`);
    await fs.writeFile(scrapFile, JSON.stringify(scrap, null, 2));
    
    await fs.writeFile(this.indexPath, JSON.stringify(items, null, 2));
  }

  async delete(id: string): Promise<void> {
    const items = await this.list();
    const filtered = items.filter(item => item.id !== id);
    
    const scrapFile = path.join(this.scrapsPath, `${id}.json`);
    try {
      await fs.unlink(scrapFile);
    } catch {
      // File might not exist
    }
    
    await fs.writeFile(this.indexPath, JSON.stringify(filtered, null, 2));
  }

  async update(id: string, updates: Partial<ScrapData>): Promise<void> {
    const item = await this.get(id);
    if (!item) {
      throw new Error(`Scrap with id ${id} not found`);
    }
    
    const updated = { ...item, ...updates, updatedAt: new Date().toISOString() };
    await this.save(updated);
  }
}