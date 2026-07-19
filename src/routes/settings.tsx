import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Javan" },
      { name: "description", content: "Manage your account, privacy, security, notifications, and appearance settings on Javan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Settings · Javan" },
      { property: "og:description", content: "Manage your account, privacy, security, notifications, and appearance settings on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/settings" },
      { name: "twitter:title", content: "Settings · Javan" },
      { name: "twitter:description", content: "Manage your account, privacy, security, notifications, and appearance settings on Javan." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/settings" }],
  }),
  component: () => <Outlet />,
});
