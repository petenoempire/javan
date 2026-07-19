import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/posts/$id")({
  loader: async ({ params }) => {
    const { data: post } = await supabase
      .from("posts")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    return { post };
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post as any;
    const title = post ? "Post · Javan" : "Post not found · Javan";
    const description = post?.content?.slice(0, 150) || "View this post on Javan.";
    const url = `https://javan.lovable.app/posts/${params.id}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PostDetailPage,
});

function PostDetailPage() {
  const { id } = Route.useParams();

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
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
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
  );
}
