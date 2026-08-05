import React, { useEffect, useState, useRef } from "react";
import { X, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  type: "photo" | "video";
  url: string;
  thumbnail?: string;
  duration?: number;
  selected?: boolean;
}

interface MediaGalleryPickerProps {
  onSelect: (items: MediaItem[]) => void;
  onClose: () => void;
  multiSelect?: boolean;
}

export const MediaGalleryPicker: React.FC<MediaGalleryPickerProps> = ({
  onSelect,
  onClose,
  multiSelect = false,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [album, setAlbum] = useState<"all" | "photos" | "videos">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load media from device
  useEffect(() => {
    loadMediaFromDevice();
  }, []);

  const loadMediaFromDevice = async () => {
    setIsLoading(true);
    try {
      // For now, we'll use a file input to simulate gallery access
      // In a real app, this would use the File System Access API or similar
      const items: MediaItem[] = [];
      setMediaItems(items);
    } catch (error) {
      console.error("Failed to load media:", error);
      toast.error("Failed to load media from device");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: MediaItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith("video/");
      const url = URL.createObjectURL(file);

      newItems.push({
        id: `${Date.now()}-${i}`,
        type: isVideo ? "video" : "photo",
        url,
      });
    }

    setMediaItems([...mediaItems, ...newItems]);
  };

  const handleItemSelect = (item: MediaItem) => {
    if (multiSelect) {
      setSelectedItems((prev) => {
        const isSelected = prev.find((i) => i.id === item.id);
        if (isSelected) {
          return prev.filter((i) => i.id !== item.id);
        } else {
          return [...prev, item];
        }
      });
    } else {
      setSelectedItems([item]);
    }
  };

  const handleConfirm = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }
    onSelect(selectedItems);
  };

  const filteredItems = mediaItems.filter((item) => {
    if (album === "photos") return item.type === "photo";
    if (album === "videos") return item.type === "video";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <h2 className="text-lg font-bold">Select Media</h2>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 active:scale-90 transition-transform"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Album selector */}
      <div className="flex gap-2 px-4 py-3 border-b border-white/10 overflow-x-auto">
        {(["all", "photos", "videos"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAlbum(a)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              album === a
                ? "bg-gradient-to-r from-fuchsia-600 to-cyan-600"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>

      {/* Media grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ImageIcon className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/50">No media found</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 bg-white/20 hover:bg-white/30"
            >
              Import from Device
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.find((i) => i.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-cyan-400" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt="Media"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {isSelected && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Check className="h-6 w-6 text-cyan-400" />
                    </div>
                  )}

                  {item.type === "video" && item.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-bold">
                      {Math.floor(item.duration / 1000)}s
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-4 border-t border-white/10 bg-black/50 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">
            {selectedItems.length} selected
          </span>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="text-xs"
          >
            Import More
          </Button>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={selectedItems.length === 0}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-rose-600 disabled:opacity-50"
        >
          Import {selectedItems.length > 0 ? `(${selectedItems.length})` : ""}
        </Button>
      </div>
    </div>
  );
};
