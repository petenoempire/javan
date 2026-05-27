import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { chats } from "@/lib/mock";
import { Search, Edit3 } from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox · Admiralty" }] }),
  component: Inbox,
});

function Inbox() {
  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">Inbox</h1>
          <button className="bg-gradient-primary flex h-10 w-10 items-center justify-center rounded-full shadow-glow">
            <Edit3 className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>
        <div className="glass mt-4 flex items-center gap-3 rounded-2xl px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input placeholder="Search messages" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-6 space-y-1">
          {chats.map((c) => (
            <Link key={c.id} to="/inbox/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-2xl p-3 transition active:scale-[0.98] hover:bg-muted">
              <div className="relative">
                <img src={c.user.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-accent" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold">{c.user.name}</span>
                  <span className="text-xs text-muted-foreground">{c.time}</span>
                </div>
                <div className="truncate text-sm text-muted-foreground">{c.lastMessage}</div>
              </div>
              {c.unread > 0 && (
                <span className="bg-gradient-primary flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-primary-foreground">
                  {c.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
