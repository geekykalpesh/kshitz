import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

export const works = pgTable('works', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  videoLink: text('video_link').notNull().default(''),
  imageThumbnailLink: text('image_thumbnail_link').default(''),
  tags: varchar('tags', { length: 500 }).default(''),
  category: varchar('category', { length: 50 }).notNull().default('HORIZONTAL'),
  featured: boolean('featured').notNull().default(false),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Work = typeof works.$inferSelect;
export type NewWork = typeof works.$inferInsert;
