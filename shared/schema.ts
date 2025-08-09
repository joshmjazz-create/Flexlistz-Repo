import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  tags: json("tags").$type<Record<string, string>>().default({}),
});

export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(),
  value: text("value").notNull(),
});

export const itemTags = pgTable("item_tags", {
  itemId: varchar("item_id").notNull(),
  tagId: varchar("tag_id").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.itemId, table.tagId] }),
}));

// Relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  collection: one(collections, {
    fields: [items.collectionId],
    references: [collections.id],
  }),
  itemTags: many(itemTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  itemTags: many(itemTags),
}));

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  item: one(items, {
    fields: [itemTags.itemId],
    references: [items.id],
  }),
  tag: one(tags, {
    fields: [itemTags.tagId],
    references: [tags.id],
  }),
}));

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

export const insertItemTagSchema = createInsertSchema(itemTags);

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type ItemTag = typeof itemTags.$inferSelect;
export type InsertItemTag = z.infer<typeof insertItemTagSchema>;

export interface CollectionWithCount extends Collection {
  itemCount: number;
}
