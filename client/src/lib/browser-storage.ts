import { type Collection, type InsertCollection, type Item, type InsertItem, type CollectionWithCount, type Tag, type InsertTag } from "@shared/schema";
import { nanoid } from "nanoid";

// Browser-based storage interface matching the server IStorage
export interface IBrowserStorage {
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
  filterItems(collectionId: string, filters: Record<string, string | string[]>, searchQuery?: string): Promise<Item[]>;
  getAvailableTags(collectionId: string): Promise<Record<string, string[]>>;
  
  // Tag cataloging
  getTagKeys(): Promise<string[]>;
  getTagValues(key: string): Promise<string[]>;
  getFieldValues(field: 'key' | 'composer' | 'style'): Promise<string[]>;
  upsertTag(key: string, value: string): Promise<Tag>;
  
  // Import items
  importItems(targetCollectionId: string, itemIds: string[]): Promise<{ count: number }>;

  // File storage
  storeFile(file: File): Promise<string>; // Returns a local identifier
  getFileUrl(fileId: string): Promise<string | null>; // Returns blob URL or base64
}

// Database structure for localStorage
interface LocalDatabase {
  collections: Collection[];
  items: Item[];
  tags: Tag[];
  itemTags: { itemId: string; tagId: string }[];
  files: { id: string; data: string; name: string; type: string }[]; // base64 data
}

const STORAGE_KEY = 'flexlist_db';
const FILE_STORAGE_KEY = 'flexlist_files';

class BrowserStorage implements IBrowserStorage {
  private db: LocalDatabase = {
    collections: [],
    items: [],
    tags: [],
    itemTags: [],
    files: []
  };

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        this.db = { ...this.db, ...parsedData };
      } else {
        // Initialize with default sample data if none exists
        this.initializeDefaultData();
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      this.initializeDefaultData();
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  private initializeDefaultData(): void {
    // Create sample collection
    const sampleCollection: Collection = {
      id: nanoid(),
      name: "Sample",
      description: "Sample list with jazz standards"
    };

    // Create sample tags
    const sampleTags: Tag[] = [
      { id: nanoid(), key: "Key", value: "Eb" },
      { id: nanoid(), key: "Composer", value: "Erroll Garner" },
      { id: nanoid(), key: "Style", value: "Ballad" },
      { id: nanoid(), key: "Tempo", value: "Slow" },
      { id: nanoid(), key: "Difficulty", value: "Intermediate" },
      { id: nanoid(), key: "Era", value: "1940s" },
      { id: nanoid(), key: "Form", value: "AABA" },
      { id: nanoid(), key: "Time Signature", value: "4/4" },

      { id: nanoid(), key: "Key", value: "Bb" },
      { id: nanoid(), key: "Composer", value: "Joseph Kosma" },
      { id: nanoid(), key: "Style", value: "Jazz Standard" },
      { id: nanoid(), key: "Difficulty", value: "Beginner" },
      { id: nanoid(), key: "Tempo", value: "Medium" },

      { id: nanoid(), key: "Key", value: "Ab" },
      { id: nanoid(), key: "Composer", value: "Jerome Kern" },
      { id: nanoid(), key: "Difficulty", value: "Advanced" },
      { id: nanoid(), key: "Era", value: "1930s" },
      { id: nanoid(), key: "Key Centers", value: "Multiple" }
    ];

    // Create sample items
    const sampleItems: Item[] = [
      {
        id: nanoid(),
        collectionId: sampleCollection.id,
        title: "Misty",
        key: "Eb",
        composer: "Erroll Garner",
        style: "Ballad",
        notes: "Beautiful jazz standard, great for practicing chord voicings. Known for its rich harmony and flowing melody.",
        leadSheetUrl: null,
        knowledgeLevel: "knows",
        youtubeId: "DkC9bCuahC8",
        spotifyUri: null,
        startSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nanoid(),
        collectionId: sampleCollection.id,
        title: "Autumn Leaves",
        key: "Bb",
        composer: "Joseph Kosma",
        style: "Jazz Standard",
        notes: "Perfect for beginners learning jazz progressions. Features the classic ii-V-I progression throughout.",
        leadSheetUrl: null,
        knowledgeLevel: "kind-of-knows",
        youtubeId: "r-Z8KuwI7Gc",
        spotifyUri: null,
        startSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nanoid(),
        collectionId: sampleCollection.id,
        title: "All The Things You Are",
        key: "Ab",
        composer: "Jerome Kern",
        style: "Jazz Standard",
        notes: "Sophisticated harmonic movement through multiple key centers. A masterpiece of songwriting with challenging chord changes.",
        leadSheetUrl: null,
        knowledgeLevel: "does-not-know",
        youtubeId: null,
        spotifyUri: "spotify:track:4IVLhmrJ00V9HOJ2Dd6Kbf",
        startSeconds: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Create item-tag relationships
    const itemTags: { itemId: string; tagId: string }[] = [];
    
    // Misty tags
    const mistyItem = sampleItems[0];
    itemTags.push(
      { itemId: mistyItem.id, tagId: sampleTags.find(t => t.key === "Key" && t.value === "Eb")!.id },
      { itemId: mistyItem.id, tagId: sampleTags.find(t => t.key === "Composer" && t.value === "Erroll Garner")!.id },
      { itemId: mistyItem.id, tagId: sampleTags.find(t => t.key === "Style" && t.value === "Ballad")!.id },
      { itemId: mistyItem.id, tagId: sampleTags.find(t => t.key === "Tempo" && t.value === "Slow")!.id },
      { itemId: mistyItem.id, tagId: sampleTags.find(t => t.key === "Difficulty" && t.value === "Intermediate")!.id },
      { itemId: mistyItem.id, tagId: sampleTags.find(t => t.key === "Era" && t.value === "1940s")!.id },
      { itemId: mistyItem.id, tagId: sampleTags.find(t => t.key === "Form" && t.value === "AABA")!.id },
      { itemId: mistyItem.id, tagId: sampleTags.find(t => t.key === "Time Signature" && t.value === "4/4")!.id }
    );

    // Autumn Leaves tags
    const autumnItem = sampleItems[1];
    itemTags.push(
      { itemId: autumnItem.id, tagId: sampleTags.find(t => t.key === "Key" && t.value === "Bb")!.id },
      { itemId: autumnItem.id, tagId: sampleTags.find(t => t.key === "Composer" && t.value === "Joseph Kosma")!.id },
      { itemId: autumnItem.id, tagId: sampleTags.find(t => t.key === "Style" && t.value === "Jazz Standard")!.id },
      { itemId: autumnItem.id, tagId: sampleTags.find(t => t.key === "Difficulty" && t.value === "Beginner")!.id },
      { itemId: autumnItem.id, tagId: sampleTags.find(t => t.key === "Era" && t.value === "1940s")!.id },
      { itemId: autumnItem.id, tagId: sampleTags.find(t => t.key === "Form" && t.value === "AABA")!.id },
      { itemId: autumnItem.id, tagId: sampleTags.find(t => t.key === "Tempo" && t.value === "Medium")!.id },
      { itemId: autumnItem.id, tagId: sampleTags.find(t => t.key === "Time Signature" && t.value === "4/4")!.id }
    );

    // All The Things You Are tags
    const allThingsItem = sampleItems[2];
    itemTags.push(
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Key" && t.value === "Ab")!.id },
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Composer" && t.value === "Jerome Kern")!.id },
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Style" && t.value === "Jazz Standard")!.id },
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Difficulty" && t.value === "Advanced")!.id },
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Era" && t.value === "1930s")!.id },
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Form" && t.value === "AABA")!.id },
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Tempo" && t.value === "Medium")!.id },
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Time Signature" && t.value === "4/4")!.id },
      { itemId: allThingsItem.id, tagId: sampleTags.find(t => t.key === "Key Centers" && t.value === "Multiple")!.id }
    );

    this.db = {
      collections: [sampleCollection],
      items: sampleItems,
      tags: sampleTags,
      itemTags,
      files: []
    };

    this.saveData();
  }

  // Collections
  async getCollections(): Promise<CollectionWithCount[]> {
    const collectionsWithCounts = this.db.collections.map(collection => {
      const itemCount = this.db.items.filter(item => item.collectionId === collection.id).length;
      console.log(`Collection ${collection.name} (${collection.id}): ${itemCount} items`);
      return {
        ...collection,
        itemCount
      };
    });
    console.log('Total items in storage:', this.db.items.length);
    return collectionsWithCounts;
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    return this.db.collections.find(c => c.id === id);
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const newCollection: Collection = {
      id: nanoid(),
      name: collection.name,
      description: collection.description ?? null
    };
    this.db.collections.push(newCollection);
    this.saveData();
    return newCollection;
  }

  async updateCollection(id: string, collection: Partial<InsertCollection>): Promise<Collection | undefined> {
    const index = this.db.collections.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    this.db.collections[index] = {
      ...this.db.collections[index],
      name: collection.name ?? this.db.collections[index].name,
      description: collection.description ?? this.db.collections[index].description
    };
    this.saveData();
    return this.db.collections[index];
  }

  async deleteCollection(id: string): Promise<boolean> {
    // Remove all items in the collection
    this.db.items = this.db.items.filter(item => item.collectionId !== id);
    
    // Remove the collection
    const initialLength = this.db.collections.length;
    this.db.collections = this.db.collections.filter(c => c.id !== id);
    
    if (this.db.collections.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Items
  async getItems(collectionId: string): Promise<Item[]> {
    const items = this.db.items.filter(item => item.collectionId === collectionId);
    console.log(`BrowserStorage.getItems(${collectionId}): Found ${items.length} items`, items.map(i => i.title));
    console.log('All items in storage:', this.db.items.length, this.db.items.map(i => `${i.title} (${i.collectionId})`));
    return items;
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.db.items.find(item => item.id === id);
  }

  async createItem(item: InsertItem): Promise<Item> {
    const now = new Date();
    const newItem: Item = {
      id: nanoid(),
      collectionId: item.collectionId,
      title: item.title,
      key: item.key || null,
      composer: item.composer || null,
      style: item.style || null,
      notes: item.notes || null,
      leadSheetUrl: item.leadSheetUrl || null,
      youtubeId: item.youtubeId || null,
      spotifyUri: item.spotifyUri || null,
      startSeconds: item.startSeconds || null,
      knowledgeLevel: item.knowledgeLevel || "does-not-know",
      createdAt: now,
      updatedAt: now
    };
    this.db.items.push(newItem);
    
    // Handle tags from extraTags if provided
    const extraTags = (item as any).extraTags;
    if (extraTags && Array.isArray(extraTags)) {
      for (const tag of extraTags) {
        const tagRecord = await this.upsertTag(tag.key, tag.value);
        this.db.itemTags.push({
          itemId: newItem.id,
          tagId: tagRecord.id
        });
      }
    }
    
    // Handle fixed fields as tags
    if (newItem.key) {
      const tagRecord = await this.upsertTag("Key", newItem.key);
      this.db.itemTags.push({ itemId: newItem.id, tagId: tagRecord.id });
    }
    if (newItem.composer) {
      const tagRecord = await this.upsertTag("Composer", newItem.composer);
      this.db.itemTags.push({ itemId: newItem.id, tagId: tagRecord.id });
    }
    if (newItem.style) {
      const tagRecord = await this.upsertTag("Style", newItem.style);
      this.db.itemTags.push({ itemId: newItem.id, tagId: tagRecord.id });
    }
    
    this.saveData();
    return newItem;
  }

  async updateItem(id: string, item: Partial<InsertItem>): Promise<Item | undefined> {
    const index = this.db.items.findIndex(i => i.id === id);
    if (index === -1) return undefined;

    this.db.items[index] = {
      ...this.db.items[index],
      ...item,
      updatedAt: new Date()
    };

    // Remove existing tag relationships
    this.db.itemTags = this.db.itemTags.filter(it => it.itemId !== id);
    
    // Add new tag relationships
    const extraTags = (item as any).extraTags;
    if (extraTags && Array.isArray(extraTags)) {
      for (const tag of extraTags) {
        const tagRecord = await this.upsertTag(tag.key, tag.value);
        this.db.itemTags.push({
          itemId: id,
          tagId: tagRecord.id
        });
      }
    }
    
    // Handle fixed fields as tags
    const updatedItem = this.db.items[index];
    if (updatedItem.key) {
      const tagRecord = await this.upsertTag("Key", updatedItem.key);
      this.db.itemTags.push({ itemId: id, tagId: tagRecord.id });
    }
    if (updatedItem.composer) {
      const tagRecord = await this.upsertTag("Composer", updatedItem.composer);
      this.db.itemTags.push({ itemId: id, tagId: tagRecord.id });
    }
    if (updatedItem.style) {
      const tagRecord = await this.upsertTag("Style", updatedItem.style);
      this.db.itemTags.push({ itemId: id, tagId: tagRecord.id });
    }

    this.saveData();
    return this.db.items[index];
  }

  async deleteItem(id: string): Promise<boolean> {
    const initialLength = this.db.items.length;
    this.db.items = this.db.items.filter(item => item.id !== id);
    
    // Remove tag relationships
    this.db.itemTags = this.db.itemTags.filter(it => it.itemId !== id);
    
    if (this.db.items.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Filtering
  async filterItems(collectionId: string, filters: Record<string, string | string[]>, searchQuery?: string): Promise<Item[]> {
    let items = this.db.items.filter(item => item.collectionId === collectionId);

    // Apply search query if provided
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        (item.key && item.key.toLowerCase().includes(searchTerm)) ||
        (item.composer && item.composer.toLowerCase().includes(searchTerm)) ||
        (item.style && item.style.toLowerCase().includes(searchTerm)) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    if (Object.keys(filters).length > 0) {
      items = items.filter(item => {
        // Get tags for this item
        const itemTagIds = this.db.itemTags
          .filter(it => it.itemId === item.id)
          .map(it => it.tagId);
        const itemTags = this.db.tags.filter(tag => itemTagIds.includes(tag.id));
        
        // Check each filter
        for (const [filterKey, filterValue] of Object.entries(filters)) {
          const filterValues = Array.isArray(filterValue) ? filterValue : [filterValue];
          
          // Special handling for knowledge level
          if (filterKey === "Knowledge Level") {
            if (!item.knowledgeLevel || !filterValues.includes(item.knowledgeLevel)) {
              return false;
            }
            continue;
          }
          
          // Check if item has any matching tags for this filter
          const hasMatchingTag = itemTags.some(tag => 
            tag.key === filterKey && filterValues.includes(tag.value)
          );
          
          if (!hasMatchingTag) {
            return false;
          }
        }
        return true;
      });
    }

    return items;
  }

  async getAvailableTags(collectionId: string): Promise<Record<string, string[]>> {
    const items = this.db.items.filter(item => item.collectionId === collectionId);
    const itemIds = items.map(item => item.id);
    
    const relevantTagIds = this.db.itemTags
      .filter(it => itemIds.includes(it.itemId))
      .map(it => it.tagId);
      
    const relevantTags = this.db.tags.filter(tag => relevantTagIds.includes(tag.id));
    
    const tagMap: Record<string, Set<string>> = {};
    relevantTags.forEach(tag => {
      if (!tagMap[tag.key]) {
        tagMap[tag.key] = new Set();
      }
      tagMap[tag.key].add(tag.value);
    });
    
    const result: Record<string, string[]> = {};
    Object.entries(tagMap).forEach(([key, valueSet]) => {
      result[key] = Array.from(valueSet).sort();
    });
    
    return result;
  }

  // Tag cataloging
  async getTagKeys(): Promise<string[]> {
    const keys = new Set(this.db.tags.map(tag => tag.key));
    return Array.from(keys).sort();
  }

  async getTagValues(key: string): Promise<string[]> {
    const values = this.db.tags
      .filter(tag => tag.key === key)
      .map(tag => tag.value);
    return Array.from(new Set(values)).sort();
  }

  async getFieldValues(field: 'key' | 'composer' | 'style'): Promise<string[]> {
    const values = this.db.items
      .map(item => item[field])
      .filter((value): value is string => value !== null && value.trim() !== '');
    return Array.from(new Set(values)).sort();
  }

  async upsertTag(key: string, value: string): Promise<Tag> {
    const existingTag = this.db.tags.find(tag => tag.key === key && tag.value === value);
    if (existingTag) {
      return existingTag;
    }
    
    const newTag: Tag = {
      id: nanoid(),
      key,
      value
    };
    this.db.tags.push(newTag);
    this.saveData();
    return newTag;
  }

  // Import items
  async importItems(targetCollectionId: string, itemIds: string[]): Promise<{ count: number }> {
    let importedCount = 0;
    
    for (const itemId of itemIds) {
      const sourceItem = await this.getItem(itemId);
      if (!sourceItem) continue;
      
      // Create new item in target collection
      const { id, ...itemData } = sourceItem;
      const newItemData = {
        ...itemData,
        collectionId: targetCollectionId,
      };
      
      const newItem = await this.createItem(newItemData);
      
      // Copy tags from source item to new item
      const sourceTagIds = this.db.itemTags
        .filter(it => it.itemId === itemId)
        .map(it => it.tagId);
      
      for (const tagId of sourceTagIds) {
        const tag = this.db.tags.find(t => t.id === tagId);
        if (tag) {
          const newTag = await this.upsertTag(tag.key, tag.value);
          this.db.itemTags.push({
            itemId: newItem.id,
            tagId: newTag.id
          });
        }
      }
      
      importedCount++;
    }
    
    this.saveData();
    return { count: importedCount };
  }

  // File storage
  async storeFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileId = nanoid();
        const fileData = {
          id: fileId,
          data: reader.result as string, // base64 data URL
          name: file.name,
          type: file.type
        };
        
        this.db.files.push(fileData);
        this.saveData();
        resolve(fileId);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async getFileUrl(fileId: string): Promise<string | null> {
    const file = this.db.files.find(f => f.id === fileId);
    return file ? file.data : null;
  }

  async getItemTags(itemId: string): Promise<{ key: string; value: string }[]> {
    const itemTagIds = this.db.itemTags
      .filter(it => it.itemId === itemId)
      .map(it => it.tagId);
    
    const tags = this.db.tags
      .filter(tag => itemTagIds.includes(tag.id))
      .map(tag => ({ key: tag.key, value: tag.value }));
    
    return tags;
  }
}

export const browserStorage = new BrowserStorage();