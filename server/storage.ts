import { type Collection, type InsertCollection, type Item, type InsertItem, type CollectionWithCount } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  // Collections
  getCollections(): Promise<CollectionWithCount[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  
  // Items
  getItems(collectionId: string): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;
  
  // Filtering
  filterItems(collectionId: string, filters: Record<string, string>, searchQuery?: string): Promise<Item[]>;
  getAvailableTags(collectionId: string): Promise<Record<string, string[]>>;
}

export class MemStorage implements IStorage {
  private collections: Map<string, Collection>;
  private items: Map<string, Item>;
  private dataFile: string;

  constructor() {
    this.collections = new Map();
    this.items = new Map();
    this.dataFile = path.join(process.cwd(), "data.json");
    this.loadData();
    this.seedData();
  }

  private async loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, "utf-8"));
        if (data.collections) {
          for (const collection of data.collections) {
            this.collections.set(collection.id, collection);
          }
        }
        if (data.items) {
          for (const item of data.items) {
            this.items.set(item.id, item);
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  private async saveData() {
    try {
      const data = {
        collections: Array.from(this.collections.values()),
        items: Array.from(this.items.values()),
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  private async seedData() {
    if (this.collections.size === 0) {
      // Create the "Songs I Know" collection
      const collectionId = randomUUID();
      const collection: Collection = {
        id: collectionId,
        name: "Songs I Know",
        description: "My personal collection of songs I can play",
      };
      this.collections.set(collectionId, collection);

      // Add the "Misty" item
      const itemId = randomUUID();
      const item: Item = {
        id: itemId,
        collectionId: collectionId,
        title: "Misty",
        notes: "Beautiful jazz standard, great for practicing chord voicings",
        tags: {
          "Composer": "Erroll Garner",
          "Style": "Ballad",
          "Key": "Eb",
          "Tempo": "Slow",
          "Difficulty": "Intermediate",
          "Era": "1940s"
        }
      };
      this.items.set(itemId, item);

      // Add more sample items
      const autumnLeavesId = randomUUID();
      const autumnLeaves: Item = {
        id: autumnLeavesId,
        collectionId: collectionId,
        title: "Autumn Leaves",
        notes: "Perfect for beginners learning jazz progressions",
        tags: {
          "Composer": "Joseph Kosma",
          "Style": "Jazz Standard",
          "Key": "G minor",
          "Difficulty": "Beginner"
        }
      };
      this.items.set(autumnLeavesId, autumnLeaves);

      const blueMoonId = randomUUID();
      const blueMoon: Item = {
        id: blueMoonId,
        collectionId: collectionId,
        title: "Blue Moon",
        notes: "Classic standard with simple chord progression",
        tags: {
          "Composer": "Richard Rodgers",
          "Style": "Ballad",
          "Key": "C"
        }
      };
      this.items.set(blueMoonId, blueMoon);

      await this.saveData();
    }
  }

  async getCollections(): Promise<CollectionWithCount[]> {
    const collections = Array.from(this.collections.values());
    return collections.map(collection => ({
      ...collection,
      itemCount: Array.from(this.items.values()).filter(item => item.collectionId === collection.id).length
    }));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = randomUUID();
    const collection: Collection = { 
      ...insertCollection, 
      id,
      description: insertCollection.description || null
    };
    this.collections.set(id, collection);
    await this.saveData();
    return collection;
  }

  async updateCollection(id: string, updateData: Partial<InsertCollection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updated: Collection = { ...collection, ...updateData };
    this.collections.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    const deleted = this.collections.delete(id);
    if (deleted) {
      // Delete all items in this collection
      const itemsToDelete: string[] = [];
      for (const [itemId, item] of this.items.entries()) {
        if (item.collectionId === id) {
          itemsToDelete.push(itemId);
        }
      }
      itemsToDelete.forEach(itemId => this.items.delete(itemId));
      await this.saveData();
    }
    return deleted;
  }

  async getItems(collectionId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.collectionId === collectionId);
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const item: Item = { 
      ...insertItem, 
      id,
      notes: insertItem.notes || null,
      tags: insertItem.tags || null
    };
    this.items.set(id, item);
    await this.saveData();
    return item;
  }

  async updateItem(id: string, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const updated: Item = { ...item, ...updateData };
    this.items.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    const deleted = this.items.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  async filterItems(collectionId: string, filters: Record<string, string>, searchQuery?: string): Promise<Item[]> {
    let items = Array.from(this.items.values()).filter(item => item.collectionId === collectionId);
    
    // Apply tag filters
    if (Object.keys(filters).length > 0) {
      items = items.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          return item.tags?.[key] === value;
        });
      });
    }
    
    // Apply search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        return (
          item.title.toLowerCase().includes(query) ||
          (item.notes && item.notes.toLowerCase().includes(query)) ||
          Object.values(item.tags || {}).some(tag => tag.toLowerCase().includes(query))
        );
      });
    }
    
    return items;
  }

  async getAvailableTags(collectionId: string): Promise<Record<string, string[]>> {
    const items = Array.from(this.items.values()).filter(item => item.collectionId === collectionId);
    const tagMap: Record<string, Set<string>> = {};
    
    items.forEach(item => {
      if (item.tags) {
        Object.entries(item.tags).forEach(([key, value]) => {
          if (!tagMap[key]) {
            tagMap[key] = new Set();
          }
          tagMap[key].add(value);
        });
      }
    });
    
    // Convert Sets to arrays
    const result: Record<string, string[]> = {};
    Object.entries(tagMap).forEach(([key, valueSet]) => {
      result[key] = Array.from(valueSet).sort();
    });
    
    return result;
  }
}

export const storage = new MemStorage();
