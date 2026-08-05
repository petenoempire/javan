import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { Rocket, Video, Zap, Shield, Heart, Coins, Globe, Users } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Why Javan is the Best Short Video Platform" },
      { name: "description", content: "Discover why Javan is the premier short video platform for creators. Stream live, share stories, and earn real payouts with our powerful creator tools." },
      { property: "og:title", content: "Features — Why Javan is the Best Short Video Platform" },
      { property: "og:description", content: "Explore the powerful features of Javan, the ultimate short video platform for creators to connect, grow, and earn." },
      { property: "og:url", content: "https://javan.lovable.app/features" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Features — Why Javan is the Best Short Video Platform" },
      { name: "twitter:description", content: "Discover the powerful creator tools on Javan, the next-generation short video platform." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/features" }],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  const features = [
    {
      title: "Live Streaming",
      description: "Connect with your audience in real-time. Our short video platform offers high-quality live streaming with interactive chat and gifting.",
      icon: Video,
      color: "text-rose-500",
    },
    {
      title: "Creator Payouts",
      description: "Get paid for your creativity. Javan is a short video platform that prioritizes creator earnings through direct payouts and virtual gifts.",
      icon: Coins,
      color: "text-amber-500",
    },
    {
      title: "Viral Stories",
      description: "Share your daily moments with stories that disappear after 24 hours. Keep your followers engaged on the most dynamic short video platform.",
      icon: Zap,
      color: "text-cyan-500",
    },
    {
      title: "Global Community",
      description: "Reach creators and fans worldwide. Our short video platform breaks down borders, allowing you to build a global following.",
      icon: Globe,
      color: "text-emerald-500",
    },
    {
      title: "Safety First",
      description: "Create with peace of mind. Javan uses advanced moderation to ensure a safe and positive environment for everyone on our short video platform.",
      icon: Shield,
      color: "text-blue-500",
    },
    {
      title: "Engagement Tools",
      description: "Boost your reach with built-in analytics and engagement tools designed specifically for the modern short video platform creator.",
      icon: Users,
      color: "text-purple-500",
    },
  ];

  const content = (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-chrome mb-6 tracking-tight">
          The Ultimate Short Video Platform
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Javan is built from the ground up to empower creators. Whether you're a storyteller, a gamer, or an educator, our short video platform provides the tools you need to succeed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      <div className="mt-20 p-12 rounded-[3rem] bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/5 text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to join the revolution?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Experience the future of social media. Join thousands of creators who have already made Javan their home short video platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/auth" 
            className="bg-gradient-primary px-8 py-4 rounded-full font-bold text-white shadow-glow hover:scale-105 transition-transform"
          >
            Get Started Now
          </Link>
          <Link 
            to="/discover" 
            className="px-8 py-4 rounded-full font-bold border border-white/10 hover:bg-white/5 transition-colors"
          >
            Explore Creators
          </Link>
        </div>
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
