import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { generateCaptionSuggestions, generateCaptionVariations } from "./ai-captions";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Posts router
   */
  posts: router({
    create: protectedProcedure
      .input(z.object({
        caption: z.string().optional(),
        mediaType: z.enum(["photo", "video"]),
        photoUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        s3Key: z.string(),
        duration: z.number().optional(),
        format: z.enum(["photo", "video", "story", "live", "duet", "template"]),
        hashtags: z.array(z.string()).optional(),
        aiCaption: z.string().optional(),
        aiHashtags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const post = await db.createPost({
          userId: ctx.user.id,
          caption: input.caption,
          mediaType: input.mediaType,
          photoUrl: input.photoUrl,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
          s3Key: input.s3Key,
          duration: input.duration,
          format: input.format,
          hashtags: input.hashtags ? JSON.stringify(input.hashtags) : null,
          aiCaption: input.aiCaption,
          aiHashtags: input.aiHashtags ? JSON.stringify(input.aiHashtags) : null,
        });

        return post;
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getPostById(input);
      }),

    getByUserId: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await db.getPostsByUserId(input.userId, input.limit, input.offset);
      }),

    getFeed: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await db.getFeedPosts(input.limit, input.offset);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        caption: z.string().optional(),
        aiCaption: z.string().optional(),
        aiHashtags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const post = await db.getPostById(input.id);
        if (!post || post.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return await db.updatePost(input.id, {
          caption: input.caption,
          aiCaption: input.aiCaption,
          aiHashtags: input.aiHashtags ? JSON.stringify(input.aiHashtags) : undefined,
        });
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const post = await db.getPostById(input);
        if (!post || post.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return await db.deletePost(input);
      }),
  }),

  /**
   * Media Assets router
   */
  media: router({
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["photo", "video", "background"]),
        url: z.string(),
        s3Key: z.string(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        duration: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        thumbnail: z.string().optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        return await db.createMediaAsset({
          userId: ctx.user.id,
          type: input.type,
          url: input.url,
          s3Key: input.s3Key,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          duration: input.duration,
          width: input.width,
          height: input.height,
          thumbnail: input.thumbnail,
          isPublic: input.isPublic,
        });
      }),

    getByUserId: protectedProcedure
      .input(z.object({ type: z.enum(["photo", "video", "background"]).optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return await db.getMediaAssetsByUserId(ctx.user.id, input.type);
      }),
  }),

  /**
   * Likes router
   */
  likes: router({
    like: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.likePost(ctx.user.id, input);
        return { success: true };
      }),

    unlike: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.unlikePost(ctx.user.id, input);
        return { success: true };
      }),

    isLiked: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) return false;
        return await db.isPostLikedByUser(ctx.user.id, input);
      }),
  }),

  /**
   * Comments router
   */
  comments: router({
    create: protectedProcedure
      .input(z.object({ postId: z.number(), text: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.createComment(ctx.user.id, input.postId, input.text);
        return { success: true };
      }),

    getByPostId: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getCommentsByPostId(input);
      }),
  }),

  /**
   * Follows router
   */
  follows: router({
    follow: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.followUser(ctx.user.id, input);
        return { success: true };
      }),

    unfollow: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.unfollowUser(ctx.user.id, input);
        return { success: true };
      }),

    isFollowing: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) return false;
        return await db.isFollowing(ctx.user.id, input);
      }),

    getFollowerCount: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getFollowerCount(input);
      }),
  }),

  /**
   * Audio router
   */
  audio: router({
    getTracks: publicProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await db.getAudioTracks(input.limit);
      }),

    getPopular: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return await db.getPopularAudioTracks(input.limit);
      }),
  }),
  /**
   * AI Captions router
   */
  ai: router({
    generateCaption: publicProcedure
      .input(z.object({
        mediaType: z.enum(["photo", "video"]),
        context: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await generateCaptionSuggestions(input.mediaType, input.context);
      }),

    generateCaptions: publicProcedure
      .input(z.object({
        mediaType: z.enum(["photo", "video"]),
        count: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await generateCaptionVariations(input.mediaType, input.count || 3);
      }),
  }),
});

export type AppRouter = typeof appRouter;
