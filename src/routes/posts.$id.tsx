import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/posts/$id")({
  loader: async ({ params }) => {
    try {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();
      if (postError) throw postError;

      let author: { handle: string; display_name: string } | null = null;
      if (post?.user_id) {
        const { data, error: authorError } = await supabase
          .from("profiles")
          .select("handle, display_name")
          .eq("id", post.user_id)
          .maybeSingle();
        if (authorError) throw authorError;
        author = (data as any) ?? null;
      }
      return { post, author };
    } catch (error) {
      console.error("[SSR] post loader failed", error);
      return { post: null, author: null };
    }
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post as any;
    const author = loaderData?.author as { handle: string; display_name: string } | null;
    const snippet = (post?.content || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const title = post
      ? `${snippet ? `“${snippet}”` : "Post"} by @${author?.handle ?? "javan"}`.slice(0, 60)
      : "Post not found · Javan";
    let description = post?.content?.slice(0, 150) || "View this post on Javan.";
    if (description.length < 50 && post?.content) {
      description = `${post.content} — Discover more amazing short videos, original music, and creative content from trending creators on Javan.`.slice(0, 150);
    }
    const url = `https://javan.lovable.app/posts/${params.id}`;
    const image = post?.image_url;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image
          ? [
              { property: "og:image", content: image as string },
              { name: "twitter:image", content: image as string },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: post
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SocialMediaPosting",
                headline: (post.content || "Post on Javan").slice(0, 110),
                articleBody: post.content || undefined,
                url,
                datePublished: post.created_at,
                ...(image ? { image } : {}),
                author: {
                  "@type": "Person",
                  name: author?.display_name || author?.handle || "Javan creator",
                  ...(author?.handle ? { url: `https://javan.lovable.app/u/${author.handle}` } : {}),
                },
                publisher: { "@type": "Organization", name: "Javan", url: "https://javan.lovable.app" },
              }),
            },
          ]
        : undefined,
    };
  },
  component: PostDetailPage,
});


function PostDetailPage() {
  const { id } = Route.useParams();
  const { author } = Route.useLoaderData();


  const { data: post, isLoading } = useQuery({
    queryKey: ["post-detail", id],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return (
      <MobileShell>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white" />
        </div>
      </MobileShell>
    );
  }

  if (!post) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <h1 className="font-display text-xl font-bold">Post not found</h1>
          <Link to="/" className="mt-4 text-sm text-primary">Back to feed →</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <>
    <DesktopLayout>
      <div className="max-w-4xl mx-auto py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-5 w-5" /> Back to feed
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <div className="lg:col-span-7">
              <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-glow">
                 {post.media_type === "image" && post.image_url ? (
                    <img src={post.image_url} alt="Post content" className="w-full object-contain" />
                 ) : post.video_url ? (
                    <video src={post.video_url} controls autoPlay className="w-full aspect-video object-cover" />
                 ) : null}
              </div>
           </div>
           
           <div className="lg:col-span-5 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="h-14 w-14 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg"></div>
                 <div>
                    <p className="font-black text-xl text-chrome">@{author?.handle}</p>
                    <p className="text-sm text-white/40">{author?.display_name}</p>
                 </div>
              </div>
              
              <div className="glass p-8 rounded-3xl border border-white/5">
                 <p className="text-lg text-white/80 leading-relaxed">{post.content}</p>
              </div>
              
              <div className="flex gap-6">
                 <div className="flex items-center gap-2 text-rose-500">
                    <Heart className="h-6 w-6" />
                    <span className="font-bold">{post.likes_count || 0}</span>
                 </div>
                 <div className="flex items-center gap-2 text-cyan-400">
                    <MessageCircle className="h-6 w-6" />
                    <span className="font-bold">{post.comments_count || 0}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DesktopLayout>
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
        <h2 className="sr-only">
          {post.content ? `Post by @${author?.handle}: ${post.content.slice(0, 60)}` : `Post by @${author?.handle}`}
        </h2>

        <Link to="/" aria-label="Back to feed" className="inline-flex items-center gap-1 text-white/50 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
          {post.media_type === "image" && post.image_url ? (
            <img src={post.image_url} alt="Post image" className="w-full max-h-[500px] object-cover" />
          ) : post.video_url ? (
            <video src={post.video_url} controls className="w-full aspect-video object-cover" />
          ) : null}

          <div className="px-4 py-3">
            <p className="text-sm text-white leading-relaxed">{post.content}</p>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 text-[10px] text-white/50 border-t border-white/5">
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes_count || 0}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments_count || 0}</span>
          </div>
        </div>
      </div>
    </MobileShell>
    </>
  );
}
