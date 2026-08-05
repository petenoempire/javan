import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  username: varchar("username", { length: 64 }).unique(),
  bio: text("bio"),
  avatar: varchar("avatar", { length: 512 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts table for storing video and photo content
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caption: text("caption"),
  mediaType: mysqlEnum("mediaType", ["photo", "video"]).notNull(),
  photoUrl: varchar("photoUrl", { length: 512 }),
  videoUrl: varchar("videoUrl", { length: 512 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 512 }),
  s3Key: varchar("s3Key", { length: 512 }),
  duration: int("duration"), // in milliseconds for videos
  views: int("views").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  hashtags: json("hashtags"), // JSON array of hashtag strings
  aiCaption: text("aiCaption"),
  aiHashtags: json("aiHashtags"), // JSON array of AI-suggested hashtags
  format: mysqlEnum("format", ["photo", "video", "story", "live", "duet", "template"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Media assets table for storing uploaded photos and videos
 */
export const mediaAssets = mysqlTable("mediaAssets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["photo", "video", "background"]).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 64 }),
  fileSize: int("fileSize"),
  duration: int("duration"), // in milliseconds for videos
  width: int("width"),
  height: int("height"),
  thumbnail: varchar("thumbnail", { length: 512 }),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;

/**
 * Audio tracks table for background music
 */
export const audioTracks = mysqlTable("audioTracks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }),
  url: varchar("url", { length: 512 }).notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  duration: int("duration").notNull(), // in milliseconds
  genre: varchar("genre", { length: 64 }),
  isPopular: boolean("isPopular").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AudioTrack = typeof audioTracks.$inferSelect;
export type InsertAudioTrack = typeof audioTracks.$inferInsert;

/**
 * Post audio associations
 */
export const postAudio = mysqlTable("postAudio", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  audioId: int("audioId").notNull(),
  startTime: int("startTime").default(0).notNull(), // in milliseconds
  volume: decimal("volume", { precision: 3, scale: 2 }).default("1.00").notNull(), // 0.00 to 1.00
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostAudio = typeof postAudio.$inferSelect;
export type InsertPostAudio = typeof postAudio.$inferInsert;

/**
 * Likes table for tracking user likes on posts
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Comments table
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Follows table for tracking followers
 */
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

/**
 * Creator analytics table for tracking creator metrics
 */
export const creatorAnalytics = mysqlTable("creatorAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalViews: int("totalViews").default(0).notNull(),
  totalLikes: int("totalLikes").default(0).notNull(),
  totalComments: int("totalComments").default(0).notNull(),
  totalFollowers: int("totalFollowers").default(0).notNull(),
  totalShares: int("totalShares").default(0).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export type CreatorAnalytics = typeof creatorAnalytics.$inferSelect;
export type InsertCreatorAnalytics = typeof creatorAnalytics.$inferInsert;
