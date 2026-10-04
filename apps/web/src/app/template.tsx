import type { ReactNode } from "react";

// A template (unlike a layout) remounts on every navigation, so its enter animation replays per page.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="route-transition">{children}</div>;
}
