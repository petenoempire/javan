import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { RegionProvider } from "@/providers/RegionProvider";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">Lost at sea</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page drifted off course.</p>
        <Link to="/" className="bg-gradient-primary mt-6 inline-block rounded-full px-6 py-2 text-sm font-medium text-primary-foreground shadow-glow">
          Back to feed
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold">Something broke</h1>
        <button onClick={reset} className="bg-gradient-primary mt-4 rounded-full px-6 py-2 text-sm text-primary-foreground">
          Try again
        </button>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Strict Auth Gate: If not loading, no session, and not on /auth, redirect to /auth
    if (!loading && !session && location.pathname !== "/auth") {
      navigate({ to: "/auth" });
    }
  }, [loading, session, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#020210]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  // Prevent flash of content for protected routes while redirecting
  if (!session && location.pathname !== "/auth") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#020210]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  return <>{children}</>;
}

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Javan",
  url: "https://javan.lovable.app",
  logo: "https://javan.lovable.app/logo.png",
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Javan",
  url: "https://javan.lovable.app",
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0a1a" },
      { title: "Javan: Go Live & Get Paid" },
      { name: "description", content: "Post short videos, go live, and build a real audience… then get paid for it. Javan is where creators connect, grow, and earn, all in one app." },
      { property: "og:title", content: "Javan: Go Live & Get Paid" },
      { name: "twitter:title", content: "Javan: Go Live & Get Paid" },
      { property: "og:description", content: "Post short videos, go live, and build a real audience… then get paid for it. Javan is where creators connect, grow, and earn, all in one app." },
      { name: "twitter:description", content: "Post short videos, go live, and build a real audience… then get paid for it. Javan is where creators connect, grow, and earn, all in one app." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/NJDt3e0YHtQJekjY4JRhK9U6AEH3/social-images/social-1785851860060-social-image.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/NJDt3e0YHtQJekjY4JRhK9U6AEH3/social-images/social-1785851860060-social-image.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://javan.lovable.app" },
      { name: "google-site-verification", content: "KA99Ya3sO2l7XhZfpoi-hGwkBhFVYNFZwgtdPmAyKzc" },
    ],
    links: [
      { rel: "icon", href: "/logo.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
      
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(ORG_SCHEMA),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(WEBSITE_SCHEMA),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RegionProvider>
            <AuthGuard>
              <main>
                <Outlet />
              </main>
            </AuthGuard>
            <Toaster position="top-center" richColors />
          </RegionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}