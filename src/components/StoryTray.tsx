import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useRef } from "react";
import { useAuth } from "@/lib/auth";
import { loadStoryTray, uploadStoryMedia, createStory } from "@/lib/stories";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function StoryTray() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tray = [], isLoading } = useQuery({
    queryKey: ["story-tray", user?.id],
    queryFn: () => loadStoryTray(user?.id),
    refetchInterval: 60000,
  });

  const myStories = tray.find((item) => item.author.id === user?.id);
  const others = tray.filter((item) => item.author.id !== user?.id);

  const handleAddStoryClick = () => {
    if (!user) {
      toast.error("Sign in to post a story");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Please select a photo or video");
      return;
    }

    const toastId = toast.loading("Uploading story...");
    try {
      const { url, mediaType } = await uploadStoryMedia(file, user.id);
      const { error } = await createStory({ userId: user.id, mediaUrl: url, mediaType });
      if (error) throw error;

      toast.success("Story posted!", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["story-tray"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to post story", { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 px-3 py-2 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-16 shrink-0 rounded-full bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-3 py-2 overflow-x-auto scrollbar-hide">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Your story bubble */}
      <button
        onClick={() => (myStories ? navigate({ to: "/story/$userId", params: { userId: user!.id } }) : handleAddStoryClick())}
        className="flex shrink-0 flex-col items-center gap-1 active:scale-95 transition-all"
      >
        <div
          className={`relative h-16 w-16 rounded-full p-[2px] ${
            myStories?.hasUnviewed
              ? "bg-gradient-to-tr from-fuchsia-500 to-rose-500"
              : myStories
              ? "bg-white/15"
              : "bg-transparent"
          }`}
        >
          <div className="h-full w-full rounded-full border-2 border-black overflow-hidden bg-white/10 flex items-center justify-center">
            {user ? (
              <div className="bg-gradient-primary h-full w-full" />
            ) : (
              <div className="h-full w-full bg-white/10" />
            )}
          </div>
          {user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddStoryClick();
              }}
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 border-2 border-black active:scale-90"
            >
              <Plus className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
        <span className="text-[9px] font-bold text-white/70 max-w-[64px] truncate">Your Story</span>
      </button>

      {/* Other users' story bubbles */}
      {others.map((item) => (
        <Link
          key={item.author.id}
          to="/story/$userId"
          params={{ userId: item.author.id }}
          className="flex shrink-0 flex-col items-center gap-1 active:scale-95 transition-all"
        >
          <div
            className={`h-16 w-16 rounded-full p-[2px] ${
              item.hasUnviewed ? "bg-gradient-to-tr from-fuchsia-500 to-rose-500" : "bg-white/15"
            }`}
          >
            <div className="h-full w-full rounded-full border-2 border-black overflow-hidden">
              {item.author.avatar_url ? (
                <img src={item.author.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="bg-gradient-primary h-full w-full" />
              )}
            </div>
          </div>
          <span className="text-[9px] font-bold text-white/70 max-w-[64px] truncate">
            {item.author.handle}
          </span>
        </Link>
      ))}
    </div>
  );
}
