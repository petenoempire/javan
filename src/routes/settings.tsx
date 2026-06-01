import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Admiralty" }] }),
  component: () => <Outlet />,
});
