import { type Collection, type InsertCollection, type Item, type InsertItem, type CollectionWithCount, type Tag, type InsertTag } from "@shared/schema";
import { collections, items, tags, itemTags } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";

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
  
  // Tag cataloging
  getTagKeys(): Promise<string[]>;
  getTagValues(key: string): Promise<string[]>;
  upsertTag(key: string, value: string): Promise<Tag>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  private async seedData() {
    // Check if we already have collections
    const existingCollections = await db.select().from(collections).limit(1);
    if (existingCollections.length === 0) {
      // Create the "Songs I Know" collection
      const [collection] = await db.insert(collections).values({
        name: "Songs I Know",
        description: "My personal collection of songs I can play",
      }).returning();

      // Add sample items with tags
      const sampleItems = [
        {
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
        },
        {
          title: "Autumn Leaves",
          notes: "Perfect for beginners learning jazz progressions",
          tags: {
            "Composer": "Joseph Kosma",
            "Style": "Jazz Standard",
            "Key": "G minor",
            "Difficulty": "Beginner"
          }
        },
        {
          title: "Blue Moon",
          notes: "Classic standard with simple chord progression",
          tags: {
            "Composer": "Richard Rodgers",
            "Style": "Ballad",
            "Key": "C"
          }
        }
      ];

      for (const itemData of sampleItems) {
        const [item] = await db.insert(items).values({
          collectionId: collection.id,
          title: itemData.title,
          notes: itemData.notes,
          tags: itemData.tags,
        }).returning();

        // Create tags in the tags table and link them
        for (const [key, value] of Object.entries(itemData.tags)) {
          const tag = await this.upsertTag(key, value);
          await db.insert(itemTags).values({
            itemId: item.id,
            tagId: tag.id,
          }).onConflictDoNothing();
        }
      }
    }
  }

  async getCollections(): Promise<CollectionWithCount[]> {
    const result = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        itemCount: sql<number>`count(${items.id})::int`,
      })
      .from(collections)
      .leftJoin(items, eq(collections.id, items.collectionId))
      .groupBy(collections.id);

    return result;
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection || undefined;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values(insertCollection)
      .returning();
    return collection;
  }

  async updateCollection(id: string, updateData: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [updated] = await db
      .update(collections)
      .set(updateData)
      .where(eq(collections.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCollection(id: string): Promise<boolean> {
    // Delete item_tags for all items in this collection
    await db.delete(itemTags).where(
      sql`item_id IN (SELECT id FROM items WHERE collection_id = ${id})`
    );
    
    // Delete all items in this collection
    await db.delete(items).where(eq(items.collectionId, id));
    
    // Delete the collection
    const result = await db.delete(collections).where(eq(collections.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getItems(collectionId: string): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.collectionId, collectionId));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    
    // Create tags in the tags table and link them
    if (insertItem.tags) {
      for (const [key, value] of Object.entries(insertItem.tags)) {
        const tag = await this.upsertTag(key, value);
        await db.insert(itemTags).values({
          itemId: item.id,
          tagId: tag.id,
        }).onConflictDoNothing();
      }
    }
    
    return item;
  }

  async updateItem(id: string, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const [updated] = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, id))
      .returning();
    
    if (updated && updateData.tags) {
      // Remove existing tag relationships
      await db.delete(itemTags).where(eq(itemTags.itemId, id));
      
      // Create new tag relationships
      for (const [key, value] of Object.entries(updateData.tags)) {
        const tag = await this.upsertTag(key, value);
        await db.insert(itemTags).values({
          itemId: id,
          tagId: tag.id,
        }).onConflictDoNothing();
      }
    }
    
    return updated || undefined;
  }

  async deleteItem(id: string): Promise<boolean> {
    // Delete tag relationships
    await db.delete(itemTags).where(eq(itemTags.itemId, id));
    
    // Delete the item
    const result = await db.delete(items).where(eq(items.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async filterItems(collectionId: string, filters: Record<string, string>, searchQuery?: string): Promise<Item[]> {
    let conditions = [eq(items.collectionId, collectionId)];
    
    // Apply tag filters using JSON operators
    if (Object.keys(filters).length > 0) {
      for (const [key, value] of Object.entries(filters)) {
        conditions.push(sql`${items.tags}->>${key} = ${value}`);
      }
    }
    
    // Apply search query
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.toLowerCase()}%`;
      conditions.push(
        sql`(
          LOWER(${items.title}) LIKE ${searchTerm} OR
          LOWER(${items.notes}) LIKE ${searchTerm} OR
          LOWER(${items.tags}::text) LIKE ${searchTerm}
        )`
      );
    }
    
    return await db.select().from(items).where(and(...conditions));
  }

  async getAvailableTags(collectionId: string): Promise<Record<string, string[]>> {
    const itemsInCollection = await db
      .select({ tags: items.tags })
      .from(items)
      .where(eq(items.collectionId, collectionId));
    
    const tagMap: Record<string, Set<string>> = {};
    
    itemsInCollection.forEach(item => {
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

  async getTagKeys(): Promise<string[]> {
    const result = await db.select({ key: tags.key }).from(tags).groupBy(tags.key);
    return result.map(r => r.key).sort();
  }

  async getTagValues(key: string): Promise<string[]> {
    const result = await db
      .select({ value: tags.value })
      .from(tags)
      .where(eq(tags.key, key));
    return result.map(r => r.value).sort();
  }

  async upsertTag(key: string, value: string): Promise<Tag> {
    // Try to find existing tag
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.key, key), eq(tags.value, value)));
    
    if (existingTag) {
      return existingTag;
    }
    
    // Create new tag
    const [newTag] = await db
      .insert(tags)
      .values({ key, value })
      .returning();
    
    return newTag;
  }
}

export const storage = new DatabaseStorage();
