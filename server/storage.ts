import { type Collection, type InsertCollection, type Item, type InsertItem, type CollectionWithCount, type Tag, type InsertTag } from "@shared/schema";
import { collections, items, tags, itemTags } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { buildTagsFromItem } from "./utils/tags";
import { norm } from "../client/src/utils/norm";

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
  getFieldValues(field: 'key' | 'composer' | 'style'): Promise<string[]>;
  upsertTag(key: string, value: string): Promise<Tag>;
  
  // Import items
  importItems(targetCollectionId: string, itemIds: string[]): Promise<{ count: number }>;
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

      // Add sample items with fixed fields and extra tags
      const sampleItems = [
        {
          title: "Misty",
          key: "Eb",
          composer: "Erroll Garner", 
          style: "Ballad",
          notes: "Beautiful jazz standard, great for practicing chord voicings",
          extraTags: [
            { key: "Tempo", value: "Slow" },
            { key: "Difficulty", value: "Intermediate" },
            { key: "Era", value: "1940s" }
          ]
        },
        {
          title: "Autumn Leaves",
          key: "G minor",
          composer: "Joseph Kosma",
          style: "Jazz Standard", 
          notes: "Perfect for beginners learning jazz progressions",
          extraTags: [
            { key: "Difficulty", value: "Beginner" }
          ]
        },
        {
          title: "Blue Moon",
          key: "C",
          composer: "Richard Rodgers",
          style: "Ballad",
          notes: "Classic standard with simple chord progression",
          extraTags: []
        }
      ];

      for (const itemData of sampleItems) {
        const [item] = await db.insert(items).values({
          collectionId: collection.id,
          title: itemData.title,
          key: itemData.key,
          composer: itemData.composer,
          style: itemData.style,
          notes: itemData.notes || "",
        }).returning();

        // Build unified tag list from fixed fields + extra tags
        const allTags = buildTagsFromItem(itemData);
        
        // Create tags in the tags table and link them
        for (const { key, value } of allTags) {
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

  async createItem(itemData: InsertItem): Promise<Item> {
    // Extract extra tags and remove from item data
    const { extraTags, ...itemFields } = itemData as any;
    
    const [item] = await db.insert(items).values(itemFields).returning();
    
    // Build unified tag list from fixed fields + extra tags
    const allTags = buildTagsFromItem({ ...itemFields, extraTags });
    
    // Create tag relationships
    for (const { key, value } of allTags) {
      const tag = await this.upsertTag(key, value);
      await db.insert(itemTags).values({
        itemId: item.id,
        tagId: tag.id,
      }).onConflictDoNothing();
    }
    
    return item;
  }

  async updateItem(id: string, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    // Extract extra tags and remove from update data
    const { extraTags, ...itemFields } = updateData as any;
    
    const [updated] = await db
      .update(items)
      .set(itemFields)
      .where(eq(items.id, id))
      .returning();
    
    if (updated) {
      // Remove existing tag relationships
      await db.delete(itemTags).where(eq(itemTags.itemId, id));
      
      // Build unified tag list from fixed fields + extra tags
      const itemForTags = {
        ...updated,
        key: updated.key || undefined,
        composer: updated.composer || undefined,
        style: updated.style || undefined,
        notes: updated.notes || undefined,
        extraTags
      };
      const allTags = buildTagsFromItem(itemForTags);
      
      // Create new tag relationships
      for (const { key, value } of allTags) {
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

  async filterItems(collectionId: string, filters: Record<string, string | string[]>, searchQuery?: string): Promise<Item[]> {
    let query = db.select().from(items).where(eq(items.collectionId, collectionId));
    
    // Apply search query if provided
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.toLowerCase()}%`;
      query = query.where(
        and(
          eq(items.collectionId, collectionId),
          sql`(
            LOWER(${items.title}) LIKE ${searchTerm} OR
            LOWER(${items.key}) LIKE ${searchTerm} OR
            LOWER(${items.composer}) LIKE ${searchTerm} OR
            LOWER(${items.style}) LIKE ${searchTerm} OR
            LOWER(${items.notes}) LIKE ${searchTerm}
          )`
        )
      );
    }

    // Separate knowledge level filters from tag filters
    const { "Knowledge Level": knowledgeLevels, ...tagFilters } = filters;
    
    // Apply knowledge level filtering
    if (knowledgeLevels) {
      const levelValues = Array.isArray(knowledgeLevels) ? knowledgeLevels : [knowledgeLevels];
      const currentConditions = query.toSQL();
      query = query.where(
        and(
          eq(items.collectionId, collectionId),
          sql`${items.knowledgeLevel} IN (${sql.join(
            levelValues.map(level => sql`${level}`),
            sql`, `
          )})`
        )
      );
    }

    // Apply unified tag filtering with AND logic
    if (Object.keys(tagFilters).length > 0) {
      // Build tag filter pairs using normalized comparisons
      const filterPairs: string[] = [];
      
      for (const [key, value] of Object.entries(tagFilters)) {
        const normalizedKey = norm(key);
        const filterValues = Array.isArray(value) ? value : [value];
        
        filterValues.forEach(val => {
          const normalizedValue = norm(val);
          if (normalizedValue) {
            filterPairs.push(`${normalizedKey}:${normalizedValue}`);
          }
        });
      }
      
      if (filterPairs.length > 0) {
        // Use the AND logic with normalized tag matching
        query = query
          .innerJoin(itemTags, eq(itemTags.itemId, items.id))
          .innerJoin(tags, eq(tags.id, itemTags.tagId))
          .where(
            and(
              eq(items.collectionId, collectionId),
              sql`LOWER(TRIM(${tags.key}) || ':' || TRIM(${tags.value})) IN (${sql.join(
                filterPairs.map(pair => sql`${pair}`),
                sql`, `
              )})`
            )
          )
          .groupBy(items.id)
          .having(sql`COUNT(DISTINCT LOWER(TRIM(${tags.key}) || ':' || TRIM(${tags.value}))) = ${filterPairs.length}`);
      }
    }

    return await query;
  }

  async getAvailableTags(collectionId: string): Promise<Record<string, string[]>> {
    // Get all tags for items in this collection
    const result = await db
      .select({
        key: tags.key,
        value: tags.value,
      })
      .from(tags)
      .innerJoin(itemTags, eq(itemTags.tagId, tags.id))
      .innerJoin(items, eq(items.id, itemTags.itemId))
      .where(eq(items.collectionId, collectionId))
      .groupBy(tags.key, tags.value);
    
    // Group by key
    const tagMap: Record<string, Set<string>> = {};
    result.forEach(({ key, value }) => {
      if (!tagMap[key]) {
        tagMap[key] = new Set();
      }
      tagMap[key].add(value);
    });
    
    // Convert Sets to arrays
    const finalResult: Record<string, string[]> = {};
    Object.entries(tagMap).forEach(([key, valueSet]) => {
      finalResult[key] = Array.from(valueSet).sort();
    });
    
    return finalResult;
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

  async getFieldValues(field: 'key' | 'composer' | 'style'): Promise<string[]> {
    const column = field === 'key' ? items.key : 
                   field === 'composer' ? items.composer : 
                   items.style;
    
    const result = await db.selectDistinct({ value: column })
      .from(items)
      .where(isNotNull(column));
    
    return result
      .map(row => row.value)
      .filter((value): value is string => value !== null && value.trim() !== '');
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

  async importItems(targetCollectionId: string, itemIds: string[]): Promise<{ count: number }> {
    let importedCount = 0;
    
    for (const itemId of itemIds) {
      // Get the source item
      const sourceItem = await this.getItem(itemId);
      if (!sourceItem) continue;
      
      // Create new item in target collection (without id to generate new one)
      const { id, ...itemData } = sourceItem;
      const newItemData = {
        ...itemData,
        collectionId: targetCollectionId,
      };
      
      // Create the new item
      const newItem = await this.createItem(newItemData);
      
      // Copy all tags from source item to new item
      const sourceTags = await db
        .select({ key: tags.key, value: tags.value })
        .from(itemTags)
        .innerJoin(tags, eq(tags.id, itemTags.tagId))
        .where(eq(itemTags.itemId, itemId));
      
      // Create tag relationships for new item
      for (const tag of sourceTags) {
        const tagRecord = await this.upsertTag(tag.key, tag.value);
        await db.insert(itemTags).values({
          itemId: newItem.id,
          tagId: tagRecord.id,
        }).onConflictDoNothing();
      }
      
      importedCount++;
    }
    
    return { count: importedCount };
  }
}

export const storage = new DatabaseStorage();
