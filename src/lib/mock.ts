export type Video = {
  id: string;
  user: { handle: string; name: string; avatar: string; verified?: boolean };
  caption: string;
  music: string;
  likes: number;
  comments: number;
  shares: number;
  src: string;
  poster: string;
  tags: string[];
};

const v = (id: string, handle: string, name: string, caption: string, src: string, poster: string, likes: number) => ({
  id,
  user: { handle, name, avatar: `https://i.pravatar.cc/200?u=${handle}`, verified: Math.random() > 0.5 },
  caption,
  music: "Original sound — " + name,
  likes,
  comments: Math.floor(likes / 20),
  shares: Math.floor(likes / 50),
  src,
  poster,
  tags: caption.match(/#\w+/g) ?? [],
});

export const videos: Video[] = [
  v("1", "nova", "Nova Reyes", "Sunset drift over Tokyo 🌆 #neon #tokyo #night", "https://cdn.coverr.co/videos/coverr-tokyo-at-night-7053/1080p.mp4", "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800", 248320),
  v("2", "kai", "Kai Mori", "Morning ritual ☕ #aesthetic #slowliving", "https://cdn.coverr.co/videos/coverr-pouring-coffee-1572/1080p.mp4", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", 89422),
  v("3", "luna", "Luna Park", "POV: you found the spot 🌊 #travel #ocean", "https://cdn.coverr.co/videos/coverr-ocean-waves-2244/1080p.mp4", "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=800", 512030),
  v("4", "atlas", "Atlas Chen", "Build in public — day 47 ⚡ #code #startup", "https://cdn.coverr.co/videos/coverr-a-developer-typing-on-his-laptop-2723/1080p.mp4", "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800", 34211),
  v("5", "vera", "Vera Knox", "Studio vibes only 🎧 #music #producer", "https://cdn.coverr.co/videos/coverr-dj-mixing-music-on-a-controller-9851/1080p.mp4", "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800", 178904),
];

export type LiveStream = {
  id: string;
  title: string;
  host: { handle: string; name: string; avatar: string };
  viewers: number;
  cover: string;
  category: string;
};

export const liveStreams: LiveStream[] = [
  { id: "l1", title: "Late night beats 🎶", host: { handle: "vera", name: "Vera Knox", avatar: "https://i.pravatar.cc/200?u=vera" }, viewers: 4821, cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800", category: "Music" },
  { id: "l2", title: "Q&A with the founder", host: { handle: "atlas", name: "Atlas Chen", avatar: "https://i.pravatar.cc/200?u=atlas" }, viewers: 1244, cover: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800", category: "Talk" },
  { id: "l3", title: "Cooking ramen from scratch", host: { handle: "kai", name: "Kai Mori", avatar: "https://i.pravatar.cc/200?u=kai" }, viewers: 9120, cover: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800", category: "Food" },
];

export type Gift = { id: string; name: string; icon: string; cost: number; tier: "common" | "rare" | "legendary" };
export const gifts: Gift[] = [
  { id: "rose", name: "Rose", icon: "🌹", cost: 5, tier: "common" },
  { id: "heart", name: "Heart", icon: "💖", cost: 10, tier: "common" },
  { id: "star", name: "Star", icon: "⭐", cost: 25, tier: "common" },
  { id: "crown", name: "Crown", icon: "👑", cost: 100, tier: "rare" },
  { id: "rocket", name: "Rocket", icon: "🚀", cost: 250, tier: "rare" },
  { id: "diamond", name: "Diamond", icon: "💎", cost: 500, tier: "legendary" },
  { id: "yacht", name: "Yacht", icon: "🛥️", cost: 2000, tier: "legendary" },
  { id: "galaxy", name: "Galaxy", icon: "🌌", cost: 5000, tier: "legendary" },
];

export type Chat = {
  id: string;
  user: { handle: string; name: string; avatar: string };
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
};

export const chats: Chat[] = [
  { id: "c1", user: { handle: "nova", name: "Nova Reyes", avatar: "https://i.pravatar.cc/200?u=nova" }, lastMessage: "let's collab on that edit ✨", time: "2m", unread: 2, online: true },
  { id: "c2", user: { handle: "luna", name: "Luna Park", avatar: "https://i.pravatar.cc/200?u=luna" }, lastMessage: "sent you a video", time: "1h", unread: 0, online: true },
  { id: "c3", user: { handle: "atlas", name: "Atlas Chen", avatar: "https://i.pravatar.cc/200?u=atlas" }, lastMessage: "Read", time: "5h", unread: 0, online: false },
  { id: "c4", user: { handle: "vera", name: "Vera Knox", avatar: "https://i.pravatar.cc/200?u=vera" }, lastMessage: "🎧🎧🎧", time: "1d", unread: 0, online: false },
];

export const liveChatSeed = [
  { user: "ari_88", msg: "let's gooo 🔥", color: "var(--neon)" },
  { user: "mika.jpg", msg: "first time here, love it", color: "var(--primary)" },
  { user: "deebo", msg: "🌹🌹🌹", color: "var(--rose)" },
  { user: "sora", msg: "what's the track?", color: "var(--accent)" },
  { user: "june", msg: "this view 😍", color: "var(--gold)" },
];
