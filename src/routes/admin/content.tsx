import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { Flag, Eye, Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
});

const mockVideos = Array.from({ length: 9 }).map((_, i) => ({
  id: i,
  thumb: `https://picsum.photos/seed/admiralty-${i}/400/600`,
  title: ["Sunset run", "Atelier tour", "Ocean drone", "Studio jam", "City lights", "Coffee art", "Garage build", "Live DJ set", "Backstage"][i],
  views: (50000 + i * 18421).toLocaleString(),
  likes: (4000 + i * 1200).toLocaleString(),
  comments: (200 + i * 71).toLocaleString(),
  flagged: i % 4 === 0,
}));

function AdminContent() {
  return (
    <AdminShell title="Content" subtitle="Moderate, feature, and analyze every upload on Admiralty.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {mockVideos.map((v) => (
          <div key={v.id} className="glass overflow-hidden rounded-2xl">
            <div className="relative aspect-[9/16]">
              <img src={v.thumb} alt="" className="h-full w-full object-cover" />
              {v.flagged && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                  <Flag className="h-3 w-3" /> Flagged
                </span>
              )}
            </div>
            <div className="p-3">
              <div className="truncate text-sm font-semibold">{v.title}</div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{v.views}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{v.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{v.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
