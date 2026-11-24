import type { Database } from "@/lib/types/database";
import type { Strings } from "@/lib/strings";
import { fillTemplate } from "@/lib/i18n/template";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

/**
 * THE ALT TEXT OF A GAME CARD'S PHOTOGRAPH (SEO audit, 24 Nov 2026).
 *
 * A venue's own photograph is a picture of a real court and says so: "Swish Elite 50, indoor volleyball court".
 * The default photo shows no particular place — it is decoration, and decoration has an empty alt so a screen
 * reader skips it instead of reading a description of nothing.
 */
export function venuePhotoAlt(
  input: { venue: string; surface: GameRow["surface"]; isVenuePhoto: boolean },
  t: Strings,
): string {
  if (!input.isVenuePhoto) return "";
  if (!input.surface) return fillTemplate(t.games.cardPhotoAltNoSurface, { venue: input.venue });
  return fillTemplate(t.games.cardPhotoAlt, {
    venue: input.venue,
    surface: t.games.surface[input.surface].toLocaleLowerCase(),
  });
}
