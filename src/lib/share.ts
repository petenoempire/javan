import { toast } from "sonner";

export async function shareOrCopy(data: { title?: string; text?: string; url: string }) {
  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await (navigator as Navigator).share(data);
      return;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(data.url);
    toast.success("Link copied to clipboard");
  } catch {
    toast.error("Couldn't share this link");
  }
}
