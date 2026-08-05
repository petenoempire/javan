import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { Music, Mic2, Radio, Headphones, Share2, Coins, TrendingUp, Sparkles, Layers, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/short-video-platform-for-musicians")({
  head: () => ({
    meta: [
      { title: "Javan: The Premier Short Video Platform for Musicians & Artists" },
      { name: "description", content: "Elevate your music career on Javan, the ultimate short video platform for musicians. Showcase your talent, use advanced music metadata, and get paid directly by fans." },
      { name: "keywords", content: "short video platform for musicians, music social media, artist monetization, viral music videos, musician tools, Javan app" },
      { property: "og:title", content: "Short Video Platform for Musicians | Javan" },
      { property: "og:description", content: "The only short video platform designed specifically for musicians. Advanced audio tools, artist payouts, and global reach." },
      { property: "og:url", content: "https://javan.lovable.app/short-video-platform-for-musicians" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Javan: Short Video Platform for Musicians" },
      { name: "twitter:description", content: "Built for artists. The short video platform for musicians to grow their fanbase and earn real rewards." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/short-video-platform-for-musicians" }],
  }),
  component: MusicianLandingPage,
});

function MusicianLandingPage() {
  const features = [
    {
      title: "High-Fidelity Audio",
      description: "Don't let compression ruin your sound. Our short video platform for musicians supports high-quality audio uploads so your music sounds exactly as intended.",
      icon: Headphones,
      color: "text-purple-500",
    },
    {
      title: "Advanced Music Metadata",
      description: "Optimize your reach with musician-specific tags. Tag your videos with BPM, Key, Genre, and Mood to help the right audience find your sound.",
      icon: Search,
      color: "text-cyan-500",
    },
    {
      title: "Direct Artist Payouts",
      description: "Turn your fans into patrons. Javan is a short video platform for musicians that offers direct tipping and subscription models for sustainable income.",
      icon: Coins,
      color: "text-amber-500",
    },
    {
      title: "Live Performance Studio",
      description: "Go live with professional audio routing. Connect your interface and stream high-quality live sessions directly to your followers.",
      icon: Mic2,
      color: "text-rose-500",
    },
    {
      title: "Viral Distribution",
      description: "Our algorithm is tuned for discovery. We help emerging musicians break through the noise and find their global audience.",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      title: "Collaboration Tools",
      description: "Find your next bandmate or producer. Use our built-in networking tools to collaborate with other artists on the platform.",
      icon: Layers,
      color: "text-blue-500",
    },
  ];

  const content = (
    <div className="container mx-auto px-4 py-12 md:py-20">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-bold mb-6">
          <Music size={16} />
          <span>Built for the Modern Artist</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-chrome mb-8 tracking-tight leading-tight">
          The Short Video Platform <br />
          <span className="text-gradient">for Musicians</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Stop fighting algorithms that don't understand music. Javan is the dedicated short video platform for musicians to showcase their talent, optimize for discovery, and build a real career.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/auth" 
            className="bg-gradient-primary px-10 py-5 rounded-full font-bold text-white shadow-glow hover:scale-105 transition-transform text-lg"
          >
            Start Your Artist Journey
          </Link>
          <Link 
            to="/discover" 
            className="px-10 py-5 rounded-full font-bold border border-white/10 hover:bg-white/5 transition-colors text-lg"
          >
            Explore Trending Artists
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="p-8 rounded-3xl border border-white/10 bg-card/40 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 group"
          >
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
              <feature.icon size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{feature.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* SEO Content Section */}
      <div className="max-w-4xl mx-auto mb-24 space-y-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6">Why Musicians Choose Javan</h2>
          <p className="text-lg text-muted-foreground">We understand that music is more than just audio—it's an experience.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-cyan-400">Optimized for Search Engines</h3>
            <p className="text-muted-foreground leading-relaxed">
              As a **short video platform for musicians**, we ensure your content is indexed correctly. Our platform automatically generates schema markup for your performances, making them searchable on Google and other major search engines.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={18} />
                <span>Automated SEO for every video</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={18} />
                <span>Artist-specific schema markup</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={18} />
                <span>Rich snippets for musical performances</span>
              </li>
            </ul>
          </div>
          <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-white/10 flex items-center justify-center p-12">
            <Radio size={120} className="text-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-12 md:p-20 rounded-[4rem] bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-rose-500/20 border border-white/10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-3xl -z-10"></div>
        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Ready to amplify <br />your sound?</h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Join the only short video platform for musicians that puts the artist first. Start building your audience and earning today.
        </p>
        <Link 
          to="/auth" 
          className="inline-block bg-white text-black px-12 py-6 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl"
        >
          Join Javan Today
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        <DesktopLayout>{content}</DesktopLayout>
      </div>
      <div className="md:hidden">
        <MobileShell>{content}</MobileShell>
      </div>
    </>
  );
}
