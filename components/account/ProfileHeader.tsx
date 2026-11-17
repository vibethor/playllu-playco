import type { ReactNode } from "react";

/**
 * The top of a profile: the cover, the player's identity and their three stats, as ONE dark island.
 *
 * PLAYCO (owner, 16 Nov 2026). The page is light since the rebrand; the cover is navy. Without `theme-dark` here the
 * name, the stat numbers and the "Change cover" control kept the light page's navy and vanished into the cover.
 * `pb-6` keeps the dark ground going a little past the stats, so the tabs below start on the light page with room.
 *
 * `pt-[104px]` is the room the identity row needs under the fixed header; the cover itself reaches up behind it
 * (`ProfileCover`, `-top-24`). Shared by the player's own profile and the public one.
 */
export function ProfileHeader({ children }: { children: ReactNode }) {
  return <div className="theme-dark relative pb-6 pt-[104px]">{children}</div>;
}
