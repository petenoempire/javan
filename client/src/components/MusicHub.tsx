import React, { useState, useEffect } from "react";
import { X, Volume2, Music, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";

interface AudioTrack {
  id: number;
  title: string;
  artist: string | null | undefined;
  duration: number;
  genre: string | null | undefined;
  isPopular: boolean;
}

interface MusicHubProps {
  onSelect: (track: AudioTrack, volume: number) => void;
  onClose: () => void;
}

export const MusicHub: React.FC<MusicHubProps> = ({ onSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(1);
  const [category, setCategory] = useState<"trending" | "favorites" | "recommended">(
    "trending"
  );

  const { data: tracks = [], isLoading } = trpc.audio.getTracks.useQuery({
    limit: 50,
  });

  const { data: popularTracks = [] } = trpc.audio.getPopular.useQuery({
    limit: 20,
  });

  const categories = [
    { id: "trending", label: "Trending" },
    { id: "favorites", label: "My Favorites" },
    { id: "recommended", label: "Recommended" },
  ];

  const filteredTracks = (category === "trending" ? tracks : popularTracks).filter(
    (track: AudioTrack) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = () => {
    if (selectedTrack) {
      onSelect(selectedTrack, volume);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Music className="h-5 w-5" />
          Add Sound
        </h2>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 active:scale-90 transition-transform"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="text"
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-white/10 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as any)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              category === cat.id
                ? "bg-gradient-to-r from-fuchsia-600 to-cyan-600"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tracks list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-white/50">No sounds found</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredTracks.map((track: AudioTrack) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedTrack?.id === track.id
                    ? "bg-gradient-to-r from-fuchsia-600/30 to-cyan-600/30 border border-cyan-400"
                    : "bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-sm text-white/50 truncate">
                      {track.artist || "Unknown Artist"}
                    </p>
                  </div>
                  <span className="text-xs text-white/40 ml-2">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Volume mixer */}
      {selectedTrack && (
        <div className="px-4 py-4 border-t border-white/10 bg-black/50 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Volume2 className="h-4 w-4" />
                Volume
              </label>
              <span className="text-xs text-white/60">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Now playing:</p>
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-medium truncate">{selectedTrack.title}</p>
              <p className="text-sm text-white/50 truncate">
                {selectedTrack.artist || "Unknown Artist"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleSelect}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-rose-600"
          >
            Add to Post
          </Button>
        </div>
      )}
    </div>
  );
};
