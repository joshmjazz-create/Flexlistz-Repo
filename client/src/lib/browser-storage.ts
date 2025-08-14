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
      console.log('BrowserStorage: Loading data from localStorage...');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        console.log('BrowserStorage: Found existing data in localStorage');
        const parsedData = JSON.parse(stored);
        this.db = { ...this.db, ...parsedData };
        console.log('BrowserStorage: Loaded', this.db.collections.length, 'collections and', this.db.items.length, 'items');
      } else {
        console.log('BrowserStorage: No existing data found, initializing default data');
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
      console.log('BrowserStorage.saveData: Saving data to localStorage...');
      const dataToSave = JSON.stringify(this.db);
      console.log('BrowserStorage.saveData: Data size:', dataToSave.length, 'characters');
      localStorage.setItem(STORAGE_KEY, dataToSave);
      console.log('BrowserStorage.saveData: Data saved successfully');
    } catch (error) {
      console.error('BrowserStorage.saveData: Failed to save data:', error);
      throw error;
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
    try {
      console.log('BrowserStorage.createCollection called with:', collection);
      const newCollection: Collection = {
        id: nanoid(),
        name: collection.name,
        description: collection.description ?? null
      };
      console.log('Created new collection object:', newCollection);
      
      this.db.collections.push(newCollection);
      console.log('Added to collections array. Total collections:', this.db.collections.length);
      
      this.saveData();
      console.log('Data saved successfully');
      
      return newCollection;
    } catch (error) {
      console.error('BrowserStorage.createCollection error:', error);
      throw error;
    }
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
    console.log('BrowserStorage.deleteCollection called with id:', id);
    const initialItemsLength = this.db.items.length;
    
    // Remove all items in the collection
    this.db.items = this.db.items.filter(item => item.collectionId !== id);
    console.log('Removed items from collection. Items count:', initialItemsLength, '->', this.db.items.length);
    
    // Remove the collection
    const initialLength = this.db.collections.length;
    console.log('Initial collections count:', initialLength);
    this.db.collections = this.db.collections.filter(c => c.id !== id);
    console.log('After deletion collections count:', this.db.collections.length);
    
    if (this.db.collections.length < initialLength) {
      this.saveData();
      console.log('Collection successfully deleted');
      return true;
    }
    console.log('Collection not found for deletion');
    return false;
  }

  // Items
  async getItems(collectionId: string): Promise<Item[]> {
    const items = this.db.items.filter(item => item.collectionId === collectionId);
    console.log(`BrowserStorage.getItems(${collectionId}): Found ${items.length} items`, items.map(i => i.title));
    
    // Debug: Check a few sample items to see their structure
    const sampleItems = items.slice(0, 3);
    console.log('Sample items structure:', sampleItems.map(item => ({
      title: item.title,
      key: item.key,
      composer: item.composer, 
      style: item.style,
      knowledgeLevel: item.knowledgeLevel,
      // tags: item.tags // Note: tags are stored separately in itemTags table
    })));
    
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
    console.log('BrowserStorage.deleteItem called with id:', id);
    const initialLength = this.db.items.length;
    console.log('Initial items count:', initialLength);
    
    this.db.items = this.db.items.filter(item => item.id !== id);
    console.log('After deletion items count:', this.db.items.length);
    
    // Remove tag relationships
    this.db.itemTags = this.db.itemTags.filter(it => it.itemId !== id);
    
    if (this.db.items.length < initialLength) {
      this.saveData();
      console.log('Item successfully deleted');
      return true;
    }
    console.log('Item not found for deletion');
    return false;
  }

  // Filtering
  async filterItems(collectionId: string, filters: Record<string, string | string[]>, searchQuery?: string): Promise<Item[]> {
    let items = this.db.items.filter(item => item.collectionId === collectionId);
    console.log(`Filtering ${items.length} items in collection ${collectionId} with:`, { filters, searchQuery });

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
        
        console.log(`Item ${item.title}: tags=`, itemTags.map(t => `${t.key}:${t.value}`), `legacy=(Key:${item.key}, Composer:${item.composer}, Style:${item.style})`);
        
        // Check each filter
        for (const [filterKey, filterValue] of Object.entries(filters)) {
          const filterValues = Array.isArray(filterValue) ? filterValue : [filterValue];
          console.log(`  Checking filter ${filterKey}:`, filterValues);
          
          // Special handling for knowledge level
          if (filterKey === "knowledgeLevel") {
            const itemKnowledgeLevel = item.knowledgeLevel || "does-not-know"; // Default to does-not-know if null
            if (!filterValues.includes(itemKnowledgeLevel)) {
              console.log(`    Failed knowledgeLevel check: ${itemKnowledgeLevel} not in`, filterValues);
              return false;
            }
            console.log(`    Passed knowledgeLevel check`);
            continue;
          }
          
          // Check standard tags from legacy fields (Key, Composer, Style)
          let hasMatch = false;
          if (filterKey === "Key" && item.key && filterValues.includes(item.key)) {
            hasMatch = true;
          } else if (filterKey === "Composer" && item.composer && filterValues.includes(item.composer)) {
            hasMatch = true;
          } else if (filterKey === "Style" && item.style && filterValues.includes(item.style)) {
            hasMatch = true;
          } else {
            // Check if item has any matching tags for this filter
            hasMatch = itemTags.some(tag => 
              tag.key === filterKey && filterValues.includes(tag.value)
            );
          }
          
          if (!hasMatch) {
            console.log(`    Failed filter check for ${filterKey}`);
            return false;
          }
          console.log(`    Passed filter check for ${filterKey}`);
        }
        return true;
      });
      console.log(`After filtering: ${items.length} items remain`);
    }

    return items;
  }

  async getAvailableTags(collectionId: string): Promise<Record<string, string[]>> {
    const items = this.db.items.filter(item => item.collectionId === collectionId);
    console.log(`Getting available tags for collection ${collectionId}: found ${items.length} items`);
    
    const itemIds = items.map(item => item.id);
    
    const relevantTagIds = this.db.itemTags
      .filter(it => itemIds.includes(it.itemId))
      .map(it => it.tagId);
      
    const relevantTags = this.db.tags.filter(tag => relevantTagIds.includes(tag.id));
    console.log(`Found ${relevantTags.length} custom tags for collection`);
    
    const tagMap: Record<string, Set<string>> = {};
    
    // Check a few sample items to debug legacy field data
    const sampleItems = items.slice(0, 5);
    console.log('Sample items for tag generation:', sampleItems.map(item => ({
      title: item.title,
      key: item.key,
      composer: item.composer,
      style: item.style
    })));
    
    // Add legacy fields as tags
    items.forEach(item => {
      if (item.key?.trim()) {
        if (!tagMap["Key"]) tagMap["Key"] = new Set();
        tagMap["Key"].add(item.key);
      }
      if (item.composer?.trim()) {
        if (!tagMap["Composer"]) tagMap["Composer"] = new Set();
        tagMap["Composer"].add(item.composer);
      }
      if (item.style?.trim()) {
        if (!tagMap["Style"]) tagMap["Style"] = new Set();
        tagMap["Style"].add(item.style);
      }
      // Don't add knowledgeLevel as Color here since it's handled by the UI component directly
    });
    
    console.log('Legacy field counts:', {
      Key: tagMap["Key"]?.size || 0,
      Composer: tagMap["Composer"]?.size || 0,
      Style: tagMap["Style"]?.size || 0,
      Color: tagMap["Color"]?.size || 0
    });
    
    // Add custom tags from tag system
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
    
    console.log('Available tags result:', result);
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
    console.log('BrowserStorage.importItems called with:', { targetCollectionId, itemIds });
    let importedCount = 0;
    
    for (const itemId of itemIds) {
      console.log('Processing item ID:', itemId);
      const sourceItem = await this.getItem(itemId);
      if (!sourceItem) {
        console.log('Source item not found for ID:', itemId);
        continue;
      }
      console.log('Found source item:', sourceItem.title);
      
      // Create new item in target collection
      const { id, ...itemData } = sourceItem;
      const newItemData = {
        ...itemData,
        collectionId: targetCollectionId,
      };
      
      const newItem = await this.createItem(newItemData);
      console.log('Created new item:', newItem.title);
      
      // Copy tags from source item to new item
      const sourceTagIds = this.db.itemTags
        .filter(it => it.itemId === itemId)
        .map(it => it.tagId);
      
      console.log('Found source tag IDs:', sourceTagIds);
      
      for (const tagId of sourceTagIds) {
        const tag = this.db.tags.find(t => t.id === tagId);
        if (tag) {
          const newTag = await this.upsertTag(tag.key, tag.value);
          this.db.itemTags.push({
            itemId: newItem.id,
            tagId: newTag.id
          });
          console.log('Copied tag:', tag.key, '=', tag.value);
        }
      }
      
      importedCount++;
      console.log('Successfully imported item:', newItem.title);
    }
    
    this.saveData();
    console.log('Import completed. Total imported:', importedCount);
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