import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Users, UserPlus, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Profile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchProfiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, handle, display_name, avatar_url, bio")
          .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchProfiles, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-[100] bg-[#020210]/95 backdrop-blur-xl flex flex-col"
        >
          <div className="px-6 pt-12 pb-6 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search friends or creators..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
<button
	              onClick={onClose}
	              aria-label="Close search"
	              className="h-12 w-12 rounded-2xl glass flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
	            >
	              <X className="h-6 w-6 text-white" />
	            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-12">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">Results</h3>
                {results.map((profile) => (
                  <Link
                    key={profile.id}
                    to="/u/$handle" params={{ handle: profile.handle }}
                    onClick={onClose}
                    className="flex items-center gap-4 p-3 rounded-3xl glass border border-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <Avatar className="h-12 w-12 border border-white/10 group-hover:border-cyan-400 transition-colors">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{profile.display_name?.[0] || profile.handle?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{profile.display_name}</div>
                      <div className="text-xs text-white/50 truncate">@{profile.handle}</div>
                    </div>
                    <UserPlus className="h-5 w-5 text-white/40 group-hover:text-cyan-400 transition-colors" />
                  </Link>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="text-center py-12 text-white/40">
                <p>No creators found matching "{query}"</p>
              </div>
            ) : (
              <div className="space-y-8 py-4">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link 
                      to="/discover" 
                      onClick={onClose}
                      className="flex flex-col items-center gap-3 p-6 rounded-3xl glass border border-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                        <Users className="h-6 w-6 text-cyan-400" />
                      </div>
                      <span className="text-xs font-bold">Find Friends</span>
                    </Link>
                    <Link 
                      to="/following" 
                      onClick={onClose}
                      className="flex flex-col items-center gap-3 p-6 rounded-3xl glass border border-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-purple-400" />
                      </div>
                      <span className="text-xs font-bold">Following</span>
                    </Link>
                  </div>
                </div>
                
                <div className="text-center p-8 rounded-[2.5rem] border border-dashed border-white/10 bg-white/[0.02]">
                  <Search className="h-8 w-8 text-white/10 mx-auto mb-3" />
                  <p className="text-xs text-white/30 leading-relaxed">
                    Search for creators by their name or handle to find new content and connect.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}