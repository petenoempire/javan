import { motion, AnimatePresence } from "motion/react";
import { X, Send, Heart } from "lucide-react";
import { useState } from "react";

const sampleComments = [
  { user: "nova", text: "this is unreal ✨", likes: 244 },
  { user: "kai", text: "what camera??", likes: 89 },
  { user: "luna", text: "🔥🔥🔥", likes: 1200 },
  { user: "atlas", text: "tutorial please 🙏", likes: 53 },
  { user: "vera", text: "the edit is clean", likes: 412 },
];

export function CommentDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-black/50" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="glass-strong fixed bottom-0 left-1/2 z-50 flex h-[70dvh] w-[min(480px,100vw)] -translate-x-1/2 flex-col rounded-t-3xl shadow-elegant">
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="font-display text-lg font-bold">{sampleComments.length} comments</h3>
              <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5">
              {sampleComments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <img src={`https://i.pravatar.cc/100?u=${c.user}`} className="h-9 w-9 rounded-full" alt="" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">@{c.user}</div>
                    <div className="text-sm">{c.text}</div>
                  </div>
                  <button className="flex flex-col items-center text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span className="text-[10px]">{c.likes}</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4">
              <div className="glass flex items-center gap-2 rounded-full px-4 py-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add comment..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button onClick={() => setText("")} className="bg-gradient-primary rounded-full p-2">
                  <Send className="h-4 w-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
