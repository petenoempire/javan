import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, posts, mediaAssets, likes, comments, follows, audioTracks, postAudio } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "username", "bio", "avatar"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Posts queries
 */
export async function createPost(data: typeof posts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(posts).values(data);
  return result;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPostsByUserId(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getFeedPosts(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updatePost(id: number, data: Partial<typeof posts.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(posts).set(data).where(eq(posts.id, id));
  return getPostById(id);
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(posts).where(eq(posts.id, id));
  return true;
}

/**
 * Media Assets queries
 */
export async function createMediaAsset(data: typeof mediaAssets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(mediaAssets).values(data);
  return result;
}

export async function getMediaAssetsByUserId(userId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];

  const whereCondition = type 
    ? and(eq(mediaAssets.userId, userId), eq(mediaAssets.type as any, type))
    : eq(mediaAssets.userId, userId);

  return await db.select().from(mediaAssets)
    .where(whereCondition)
    .orderBy(desc(mediaAssets.createdAt));
}

/**
 * Likes queries
 */
export async function likePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const post = await getPostById(postId);
  await db.insert(likes).values({ userId, postId });
  await db.update(posts).set({ likes: (post?.likes ?? 0) + 1 }).where(eq(posts.id, postId));
}

export async function unlikePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const post = await getPostById(postId);
  await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  await db.update(posts).set({ likes: Math.max(0, (post?.likes ?? 0) - 1) }).where(eq(posts.id, postId));
}

export async function isPostLikedByUser(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Comments queries
 */
export async function createComment(userId: number, postId: number, text: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const post = await getPostById(postId);
  await db.insert(comments).values({ userId, postId, text });
  await db.update(posts).set({ comments: (post?.comments ?? 0) + 1 }).where(eq(posts.id, postId));
}

export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
}

/**
 * Follows queries
 */
export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(follows).values({ followerId, followingId });
}

export async function unfollowUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}

export async function isFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);

  return result.length > 0;
}

export async function getFollowerCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select().from(follows)
    .where(eq(follows.followingId, userId));

  return result.length;
}

/**
 * Audio Tracks queries
 */
export async function getAudioTracks(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(audioTracks)
    .orderBy(desc(audioTracks.isPopular), desc(audioTracks.createdAt))
    .limit(limit);
}

export async function getPopularAudioTracks(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(audioTracks)
    .where(eq(audioTracks.isPopular, true))
    .limit(limit);
}

/**
 * Post Audio associations
 */
export async function addAudioToPost(postId: number, audioId: number, startTime = 0, volume = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(postAudio).values({ postId, audioId, startTime, volume: volume as any });
}

export async function getPostAudio(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(postAudio).where(eq(postAudio.postId, postId));
}
