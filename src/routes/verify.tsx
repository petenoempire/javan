// /verify is deprecated. Verification now lives inside Settings → Account → Verification.
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/verify")({
  component: () => <Navigate to="/settings/account/verification" replace />,
});
