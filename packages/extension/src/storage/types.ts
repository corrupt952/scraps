export interface ScrapData {
  id: string;
  label: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageProvider {
  initialize(): Promise<void>;
  list(): Promise<ScrapData[]>;
  get(id: string): Promise<ScrapData | null>;
  save(scrap: ScrapData): Promise<void>;
  delete(id: string): Promise<void>;
  update(id: string, updates: Partial<ScrapData>): Promise<void>;
}

export enum StorageType {
  GlobalState = "globalState",
  File = "file",
}
