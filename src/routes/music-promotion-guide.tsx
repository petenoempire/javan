import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import {
  Music,
  Mic2,
  TrendingUp,
  DollarSign,
  Share2,
  BarChart3,
  Users,
  Globe,
  Target,
  Megaphone,
  Calendar,
  CheckCircle2,
  Star,
  Zap,
  Headphones,
  Radio,
  Film,
  Coins,
} from "lucide-react";

export const Route = createFileRoute("/music-promotion-guide")({
  head: () => ({
    meta: [
      {
        title: "Music Promotion Guide for Independent Artists | Javan 2026",
      },
      {
        name: "description",
        content:
          "The complete music promotion guide for independent artists in 2026. Learn how to market your music, grow your fanbase, and earn direct payouts on Javan.",
      },
      {
        name: "keywords",
        content:
          "music promotion guide, how to promote music, music marketing tips, independent artist guide, promote music online, grow music fans, music marketing strategies 2026, musician promotion, artist marketing, Javan music platform",
      },
      {
        property: "og:title",
        content: "Music Promotion Guide for Independent Artists | Javan",
      },
      {
        property: "og:description",
        content:
          "A complete guide to promoting your music as an independent artist. Strategies, tools, and tips to grow your fanbase and monetize your sound.",
      },
      {
        property: "og:url",
        content: "https://javan.lovable.app/music-promotion-guide",
      },
      { property: "og:type", content: "article" },
      {
        name: "twitter:title",
        content: "Music Promotion Guide for Independent Artists | Javan",
      },
      {
        name: "twitter:description",
        content:
          "Learn how to promote your music, grow your fanbase, and earn from your art with our complete independent artist guide.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://javan.lovable.app/music-promotion-guide",
      },
    ],
  }),
  component: MusicPromotionGuidePage,
});

function MusicPromotionGuidePage() {
  const content = (
    <div className="container mx-auto px-4 py-12 md:py-20">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-bold mb-6">
          <Music size={16} />
          <span>2026 Independent Artist Guide</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-chrome mb-8 tracking-tight leading-tight">
          Music Promotion Guide <br />
          <span className="text-gradient">for Independent Artists</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          A complete step-by-step guide to promoting your music online in 2026.
          Learn proven strategies to grow your fanbase, increase streams, and
          monetize your art — without a record label.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/auth"
            className="bg-gradient-primary px-10 py-5 rounded-full font-bold text-white shadow-glow hover:scale-105 transition-transform text-lg"
          >
            Start Promoting Your Music
          </Link>
          <Link
            to={"/short-video-platform-for-musicians" as any}
            className="px-10 py-5 rounded-full font-bold border border-white/10 hover:bg-white/5 transition-colors text-lg"
          >
            Learn About Javan for Musicians
          </Link>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="glass p-8 rounded-3xl border border-white/10">
          <h2 className="text-2xl font-bold mb-6">What You'll Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "How to promote music on social media in 2026",
              "Best music marketing strategies for independent artists",
              "How to grow your music fanbase from zero",
              "Music promotion tools and platforms compared",
              "How to monetize independent music without a label",
              "Music marketing budget planning for indie artists",
              "Content strategy for musicians on short video platforms",
              "How to build an email list as a musician",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Why Music Promotion Matters */}
      <div className="max-w-4xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            Why Music Promotion Is Essential in 2026
          </h2>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-white/70 leading-relaxed">
          <p>
            The music industry has fundamentally changed. With over 100,000
            tracks uploaded to streaming platforms every day, the biggest
            challenge for independent artists is no longer recording quality
            music — it's getting heard. A comprehensive music promotion strategy
            is the difference between your music sitting in obscurity and
            reaching millions of potential fans.
          </p>
          <p>
            In 2026, music marketing has shifted from traditional label-driven
            campaigns to creator-led growth. Short video platforms, social media
            algorithms, and direct-to-fan tools have leveled the playing field.
            Independent musicians who invest in smart music promotion strategies
            can now compete with major-label artists for audience attention.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
            <div className="glass p-6 rounded-2xl border border-white/5 text-center">
              <p className="text-3xl font-black text-cyan-400 mb-2">100K+</p>
              <p className="text-sm text-white/50">
                Tracks uploaded daily to streaming platforms
              </p>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/5 text-center">
              <p className="text-3xl font-black text-rose-400 mb-2">85%</p>
              <p className="text-sm text-white/50">
                Of music discovery happens via social media
              </p>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/5 text-center">
              <p className="text-3xl font-black text-emerald-400 mb-2">70%</p>
              <p className="text-sm text-white/50">
                More engagement on short video music content
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Proven Music Promotion Strategies */}
      <div className="max-w-4xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Target className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            7 Proven Music Promotion Strategies
          </h2>
        </div>

        <div className="space-y-8">
          {[
            {
              icon: Film,
              color: "text-rose-400",
              bg: "bg-rose-500/10 border-rose-500/20",
              title: "1. Short Video Content Strategy",
              content:
                "Short video platforms like Javan have become the #1 music discovery channel. Create 15-60 second clips of your best hooks, behind-the-scenes studio moments, and live performances. The algorithm rewards consistency — post at least 3-5 music videos per week for maximum reach. Use trending sounds as backing tracks to boost discoverability.",
            },
            {
              icon: Radio,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10 border-cyan-500/20",
              title: "2. Live Streaming for Fan Engagement",
              content:
                "Go live regularly to build authentic connections with your audience. Live sessions allow fans to hear unreleased music, ask questions, and send virtual gifts that translate to direct revenue. Schedule weekly live streams and promote them across all your social channels. Consistency builds a loyal fanbase faster than any paid campaign.",
            },
            {
              icon: Users,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
              title: "3. Collaborate with Other Artists",
              content:
                "Cross-promotion is one of the most effective music marketing strategies. Partner with artists in complementary genres for duets, features, and joint live streams. This exposes your music to their audience and vice versa. On Javan, use the artist collaboration network to find musicians at your level for mutually beneficial partnerships.",
            },
            {
              icon: Share2,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
              title: "4. Multi-Platform Music Distribution",
              content:
                "Don't limit your music to one platform. Distribute your tracks across streaming services (Spotify, Apple Music, YouTube Music), short video platforms (Javan, TikTok, Instagram Reels), and community platforms. Each platform serves a different discovery intent — short video for viral reach, streaming for revenue, and community platforms for fan retention.",
            },
            {
              icon: Calendar,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
              title: "5. Consistent Release Schedule",
              content:
                "Build anticipation by maintaining a regular release cadence. Whether it's weekly snippets, monthly singles, or quarterly EPs, consistency trains the algorithm and your fans to expect your content. Use a content calendar to plan releases around holidays, trends, and cultural moments that align with your music's vibe.",
            },
            {
              icon: BarChart3,
              color: "text-fuchsia-400",
              bg: "bg-fuchsia-500/10 border-fuchsia-500/20",
              title: "6. Data-Driven Music Marketing",
              content:
                "Track which songs, thumbnails, captions, and posting times generate the most engagement. Use analytics to identify your top-performing content and double down on what works. Monitor follower growth, save rates, and share metrics — not just views. On Javan, the Creator Studio provides real-time analytics specifically designed for music promotion performance.",
            },
            {
              icon: DollarSign,
              color: "text-yellow-400",
              bg: "bg-yellow-500/10 border-yellow-500/20",
              title: "7. Direct Monetization Strategy",
              content:
                "Build multiple revenue streams beyond streaming royalties. Offer exclusive content through fan subscriptions, sell merchandise tied to your music brand, accept virtual gifts during live performances, and offer premium content to dedicated fans. Platforms like Javan allow independent artists to earn directly from their audience without label intermediaries.",
            },
          ].map((strategy, i) => (
            <div key={i} className="glass p-8 rounded-3xl border border-white/10">
              <div className="flex items-start gap-5">
                <div
                  className={`w-12 h-12 rounded-2xl ${strategy.bg} border flex items-center justify-center shrink-0`}
                >
                  <strategy.icon className={`h-6 w-6 ${strategy.color}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3">{strategy.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">
                    {strategy.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Music Promotion Tools */}
      <div className="max-w-4xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="h-6 w-6 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            Music Promotion Tools & Resources
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Film,
              title: "Javan Short Video Platform",
              description:
                "Upload high-quality music videos optimized for discovery. Built-in algorithm promotes your content to matching listeners. Direct fan payouts and tipping.",
              cta: "Join Javan",
              link: "/auth",
              accent: "from-cyan-500 to-blue-500",
            },
            {
              icon: Headphones,
              title: "Music Distribution Services",
              description:
                "Distribute your music to Spotify, Apple Music, and 150+ platforms. Compare DistroKid, TuneCore, and CD Baby for the best fit for your budget.",
              cta: "Compare Distributors",
              link: "#",
              accent: "from-purple-500 to-pink-500",
            },
            {
              icon: BarChart3,
              title: "Analytics & Insights",
              description:
                "Track your music's performance across platforms. Monitor stream counts, follower growth, engagement rates, and revenue to optimize your promotion strategy.",
              cta: "View Analytics Guide",
              link: "/studio",
              accent: "from-emerald-500 to-teal-500",
            },
            {
              icon: Mic2,
              title: "Content Creation Tools",
              description:
                "Create professional music videos, lyric videos, and behind-the-scenes content. Use templates and trending formats to maximize reach on every platform.",
              cta: "Start Creating",
              link: "/create",
              accent: "from-rose-500 to-orange-500",
            },
          ].map((tool, i) => (
            <div
              key={i}
              className="glass p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${tool.accent} flex items-center justify-center mb-6`}
              >
                <tool.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{tool.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                {tool.description}
              </p>
              <Link
                to={tool.link as any}
                className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {tool.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Building Your Fanbase */}
      <div className="max-w-4xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-rose-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            How to Grow Your Music Fanbase
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-black">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">
                  Define Your Artist Brand
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Before promoting your music, establish a clear brand identity.
                  Your visual style, tone of voice, and content themes should
                  reflect your music's genre and personality. Consistency across
                  all platforms builds recognition.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-black">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">
                  Engage with Your Community
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Respond to comments, share user-generated content, and
                  participate in your genre's community. Fans who feel seen are
                  more likely to share your music organically. Build genuine
                  relationships, not just follower counts.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-black">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">
                  Leverage User-Generated Content
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Encourage fans to create content with your music. Offer
                  exclusive snippets, provide clear usage rights, and feature the
                  best fan creations. UGC amplifies your reach exponentially
                  without additional marketing spend.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-black">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">
                  Build an Email & SMS List
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Social media followers can disappear with algorithm changes.
                  Collect email addresses and phone numbers to maintain direct
                  communication with your most dedicated fans. Offer exclusive
                  content or early access as an incentive to subscribe.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />
                Pro Tip: The 80/20 Rule
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Spend 80% of your content promoting entertainment value (fun
                moments, behind-the-scenes, reactions) and only 20% directly
                promoting your music. Fans follow for personality first, music
                second.
              </p>
            </div>

            <div className="glass p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-rose-500/5 to-amber-500/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-cyan-400" />
                Global Reach Strategy
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Short video platforms break geographic barriers. A musician in
                Lagos can reach fans in Tokyo within hours of posting. Optimize
                your captions and hashtags for multiple regions. Use Javan's
                global distribution to test which markets respond best to your
                sound.
              </p>
            </div>

            <div className="glass p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Viral Content Formula
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                The most shareable music content follows a simple pattern: a
                compelling hook in the first 2 seconds, a relatable moment or
                emotion, and a clear call-to-action. Test different formats —
                lyric reveals, reaction videos, and dance challenges — to find
                what resonates with your target audience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Monetization */}
      <div className="max-w-4xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-amber-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            Monetizing Your Music Without a Label
          </h2>
        </div>

        <p className="text-white/60 leading-relaxed mb-10 max-w-3xl">
          The traditional music industry model relied on record labels to fund
          promotion and distribution in exchange for the majority of revenue.
          Today, independent artists have access to tools that allow them to
          retain creative control and a much larger share of their earnings.
          Here's how to build a sustainable income from your music.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Coins,
              title: "Direct Fan Payouts",
              description:
                "Accept virtual gifts, tips, and subscriptions directly from fans. Platforms like Javan allow you to earn up to 70% of revenue with no label taking a cut.",
              metric: "Up to 70% revenue share",
              color: "text-cyan-400",
            },
            {
              icon: Radio,
              title: "Live Performance Revenue",
              description:
                "Host ticketed live streams, virtual concerts, and exclusive Q&A sessions. Charge admission or accept donations during your live performances.",
              metric: "$5-50 per live session",
              color: "text-rose-400",
            },
            {
              icon: Music,
              title: "Streaming + Video Royalties",
              description:
                "Earn from both traditional streaming (Spotify, Apple Music) and short video platform views. Diversify across platforms to maximize total income.",
              metric: "Multiple revenue streams",
              color: "text-emerald-400",
            },
          ].map((stream, i) => (
            <div
              key={i}
              className="glass p-8 rounded-3xl border border-white/10 text-center"
            >
              <stream.icon className={`h-10 w-10 ${stream.color} mx-auto mb-4`} />
              <h3 className="text-xl font-bold mb-3">{stream.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                {stream.description}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/80">
                {stream.metric}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto">
        <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-rose-500/20 border border-white/10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-3xl -z-10"></div>
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Ready to Launch Your <br />
            Music Promotion Career?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            You don't need a record label, a massive budget, or industry
            connections to promote your music effectively. Join Javan's music
            marketing platform and start building your fanbase today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="inline-block bg-white text-black px-10 py-5 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-2xl"
            >
              Join Javan — It's Free
            </Link>
            <Link
              to={"/short-video-platform-for-musicians" as any}
              className="inline-block px-10 py-5 rounded-full font-bold border border-white/20 hover:bg-white/10 transition-colors text-lg"
            >
              Learn More About Javan
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ Schema Section */}
      <div className="max-w-4xl mx-auto mt-24 space-y-6">
        <h2 className="text-2xl font-bold text-center mb-10">
          Frequently Asked Questions About Music Promotion
        </h2>
        {[
          {
            q: "How much does it cost to promote music as an independent artist?",
            a: "You can start promoting music for free on platforms like Javan. Organic music marketing through short video content, social media, and live streaming costs nothing but your time. Paid options include social media ads ($50-500/month), playlist pitching services ($20-100/campaign), and PR campaigns ($500-5000+).",
          },
          {
            q: "What's the best platform to promote music in 2026?",
            a: "Short video platforms like Javan are the most effective music discovery channels in 2026, with 85% of music discovery happening via social media. The best strategy combines short video content for reach, streaming platforms for revenue, and community platforms for fan retention.",
          },
          {
            q: "How long does it take to grow a music fanbase?",
            a: "With consistent content posting (3-5 videos per week), most independent artists see measurable fanbase growth within 2-3 months. Building a sustainable audience of 10,000+ engaged fans typically takes 6-12 months of dedicated music promotion effort.",
          },
          {
            q: "Can I make money from music promotion without a record label?",
            a: "Absolutely. Independent artists on platforms like Javan earn direct payouts from virtual gifts, subscriptions, and ad revenue. With a strong fanbase, you can generate $1,000-10,000+ per month through direct monetization — more than most independent artists earn from streaming royalties alone.",
          },
        ].map((faq, i) => (
          <details
            key={i}
            className="glass rounded-2xl border border-white/10 p-6 group"
          >
            <summary className="font-bold text-white cursor-pointer list-none flex items-center justify-between">
              <span>{faq.q}</span>
              <span className="text-white/40 group-open:rotate-180 transition-transform">
                +
              </span>
            </summary>
            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              {faq.a}
            </p>
          </details>
        ))}
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

