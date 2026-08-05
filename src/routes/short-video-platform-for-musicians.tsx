import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { Music, Mic2, Radio, Headphones, Share2, Coins, TrendingUp, Sparkles, Layers, Search, Megaphone, Target, BarChart3, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/short-video-platform-for-musicians")({
  head: () => ({
    meta: [
      { title: "Music Marketing Platform for Artists | Javan" },
      { name: "description", content: "Javan is a music marketing platform for independent artists. Promote your music, grow your fanbase, and earn direct payouts." },
      { name: "keywords", content: "music marketing platform, music marketing for independent artists, promote music online, musician promotion tools, artist marketing strategy, music distribution platform, grow music fans, musician monetization, short video platform for musicians, music social media, artist monetization, viral music videos, musician tools, Javan app, music promotion strategy, digital music marketing" },
      { property: "og:title", content: "Music Marketing Platform for Artists | Javan" },
      { property: "og:description", content: "Promote your music, grow your fanbase, and earn direct payouts with Javan's music marketing platform for independent artists." },
      { property: "og:url", content: "https://javan.lovable.app/short-video-platform-for-musicians" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Music Marketing Platform for Artists | Javan" },
      { name: "twitter:description", content: "The music marketing platform for independent artists. Promote your sound and earn real rewards." },
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
      description: "Don't let compression ruin your sound. Our music marketing platform supports high-quality audio uploads so your music sounds exactly as intended — crucial for professional artist branding.",
      icon: Headphones,
      color: "text-purple-500",
    },
    {
      title: "Advanced Music Metadata",
      description: "Optimize your reach with musician-specific tags. Tag your videos with BPM, Key, Genre, and Mood to help the right audience find your sound through our music marketing tools.",
      icon: Search,
      color: "text-cyan-500",
    },
    {
      title: "Direct Artist Payouts",
      description: "Turn your fans into patrons. Javan is a music marketing platform that offers direct tipping and subscription models — monetize your music without relying on traditional streaming royalties.",
      icon: Coins,
      color: "text-amber-500",
    },
    {
      title: "Live Performance Studio",
      description: "Go live with professional audio routing. Connect your interface and stream high-quality live sessions — a powerful music marketing strategy that builds authentic fan connections.",
      icon: Mic2,
      color: "text-rose-500",
    },
    {
      title: "Viral Music Promotion",
      description: "Our algorithm is tuned for discovery. We help emerging musicians break through the noise and find their global audience — the best music marketing platform for organic growth.",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      title: "Artist Collaboration Network",
      description: "Find your next bandmate or producer. Use our built-in networking tools to collaborate with other artists — essential for cross-promotion and expanding your music marketing reach.",
      icon: Layers,
      color: "text-blue-500",
    },
  ];

  const marketingBenefits = [
    {
      icon: Megaphone,
      title: "Built-In Music Promotion",
      description: "Every video you share is optimized for music discovery. Our platform automatically promotes your content to listeners who match your genre, style, and audience profile — no paid ads required.",
    },
    {
      icon: Target,
      title: "Precision Audience Targeting",
      description: "Our music marketing algorithm understands genres, moods, and listener behavior. Your music reaches the right audience — people actively searching for new sounds, not just random scrollers.",
    },
    {
      icon: BarChart3,
      title: "Real-Time Marketing Analytics",
      description: "Track your music marketing performance with detailed analytics. Monitor engagement, follower growth, and revenue in real-time to refine your artist promotion strategy.",
    },
    {
      icon: Globe,
      title: "Global Music Distribution",
      description: "Reach listeners worldwide without geographic limitations. Javan's music marketing platform gives independent artists the same global reach as major label musicians.",
    },
  ];

  const content = (
    <div className="container mx-auto px-4 py-12 md:py-20">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-bold mb-6">
          <Music size={16} />
          <span>The #1 Music Marketing Platform for Artists</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-chrome mb-8 tracking-tight leading-tight">
          The Music Marketing Platform <br />
          <span className="text-gradient">Built for Musicians</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Stop fighting algorithms that don't understand music. Javan is the dedicated music marketing platform for independent musicians to promote their sound, optimize for discovery, and build a sustainable career — without middlemen.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/auth" 
            className="bg-gradient-primary px-10 py-5 rounded-full font-bold text-white shadow-glow hover:scale-105 transition-transform text-lg"
          >
            Start Your Music Marketing Journey
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

      {/* Music Marketing Benefits Section */}
      <div className="max-w-5xl mx-auto mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6">Why Musicians Choose Javan for Music Marketing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We understand that music marketing for independent artists requires more than just posting content. Here's why Javan is the music marketing platform that delivers real results.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {marketingBenefits.map((benefit, i) => (
            <div key={i} className="flex gap-6 items-start">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <benefit.icon className="h-7 w-7 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Content Section */}
      <div className="max-w-4xl mx-auto mb-24 space-y-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6">Music Marketing Made Simple for Independent Artists</h2>
          <p className="text-lg text-muted-foreground">As a leading music marketing platform, we've built every tool specifically for musicians who want to grow their audience and monetize their craft.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-cyan-400">Optimized Music Marketing Engine</h3>
            <p className="text-muted-foreground leading-relaxed">
              As a dedicated **music marketing platform for musicians**, we ensure your content is indexed correctly and promoted to the right audience. Our platform automatically generates schema markup for your performances, making them searchable on Google and other major search engines.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={18} />
                <span>Automated SEO for every music video</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={18} />
                <span>Artist-specific schema markup for music marketing</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={18} />
                <span>Rich snippets for musical performances</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={18} />
                <span>Genre-based discovery for music promotion</span>
              </li>
            </ul>
          </div>
          <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-white/10 flex items-center justify-center p-12">
            <Radio size={120} className="text-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* How It Works - Music Marketing Steps */}
      <div className="max-w-4xl mx-auto mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6">How Javan's Music Marketing Works</h2>
          <p className="text-lg text-muted-foreground">Three steps to growing your music career on the best music marketing platform for independent artists.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-3xl glass border border-white/5">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6 text-2xl font-black">1</div>
            <h3 className="text-xl font-bold mb-3">Upload Your Music</h3>
            <p className="text-muted-foreground">Share high-quality music videos, live performances, and original tracks with metadata optimized for music discovery.</p>
          </div>
          <div className="text-center p-8 rounded-3xl glass border border-white/5">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6 text-2xl font-black">2</div>
            <h3 className="text-xl font-bold mb-3">Grow Your Audience</h3>
            <p className="text-muted-foreground">Our music marketing algorithm promotes your content to listeners who match your genre and style — organic growth without paid ads.</p>
          </div>
          <div className="text-center p-8 rounded-3xl glass border border-white/5">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6 text-2xl font-black">3</div>
            <h3 className="text-xl font-bold mb-3">Earn From Your Music</h3>
            <p className="text-muted-foreground">Monetize directly through fan tips, subscriptions, and gifts. Keep up to 70% of revenue — no record label needed.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-12 md:p-20 rounded-[4rem] bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-rose-500/20 border border-white/10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-3xl -z-10"></div>
        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Ready to Market Your Music <br />Effectively?</h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Join the only music marketing platform for musicians that puts the artist first. Start building your audience, promoting your sound, and earning from your music today.
        </p>
        <Link 
          to="/auth" 
          className="inline-block bg-white text-black px-12 py-6 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl"
        >
          Join Javan — Start Marketing Your Music
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
