import * as vscode from "vscode";
import { ScrapData, StorageType } from "./storage/types";

export class StorageGroupItem extends vscode.TreeItem {
  constructor(
    public readonly storageType: StorageType,
    public readonly isAvailable: boolean,
    public readonly itemCount: number
  ) {
    const label = StorageGroupItem.getLabel(storageType);
    const state = itemCount > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
    
    super(label, state);
    
    this.contextValue = `storageGroup-${isAvailable ? 'available' : 'unavailable'}`;
    this.iconPath = StorageGroupItem.getIcon(storageType);
    
    if (!isAvailable) {
      this.description = "(Not Available - No Workspace)";
      this.tooltip = "File storage requires an open workspace";
    } else {
      this.description = `(${itemCount} items)`;
    }
  }
  
  private static getLabel(type: StorageType): string {
    switch (type) {
      case StorageType.GlobalState:
        return "Global Storage";
      case StorageType.File:
        return "File Storage";
      default:
        return "Unknown Storage";
    }
  }
  
  private static getIcon(type: StorageType): vscode.ThemeIcon {
    switch (type) {
      case StorageType.GlobalState:
        return new vscode.ThemeIcon("globe");
      case StorageType.File:
        return new vscode.ThemeIcon("folder");
      default:
        return new vscode.ThemeIcon("question");
    }
  }
}

export class ScrapItem extends vscode.TreeItem {
  public readonly id: string;
  public readonly content: string;
  public readonly createdAt: string;
  public readonly updatedAt: string;
  public readonly storageType: StorageType;

  constructor(scrap: ScrapData, storageType: StorageType) {
    const timeLabel = ScrapItem.getTimeLabel(scrap.updatedAt);
    super(scrap.label, vscode.TreeItemCollapsibleState.None);
    
    this.id = scrap.id;
    this.content = scrap.content;
    this.createdAt = scrap.createdAt;
    this.updatedAt = scrap.updatedAt;
    this.storageType = storageType;
    
    this.description = timeLabel;
    this.iconPath = new vscode.ThemeIcon("note");
    this.tooltip = `Created: ${new Date(scrap.createdAt).toLocaleString()}\nUpdated: ${new Date(scrap.updatedAt).toLocaleString()}\nStorage: ${storageType}`;
    this.contextValue = `scrapItem-${storageType}`;
    this.command = {
      command: "scraps.editItem",
      title: "Edit",
      arguments: [this],
    };
  }

  private static getTimeLabel(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;

    if (diffInMinutes < 5) {
      return "";
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "yesterday";
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }
}