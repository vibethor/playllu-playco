import { strings } from "@/lib/strings";

/** Uploaded venue photos live under this prefix in the `venue-photos` bucket; app-shipped ones start with "/". */
const VENUE_PHOTO_KEY_PREFIX = "venues/";

/**
 * What the venue photo button says (owner, 17 Nov 2026). While the photo goes up it says so, instead of only
 * fading: on a phone the upload takes a few seconds, and a faded button reads as "still loading" or "broken".
 */
export function venuePhotoControlLabel({ busy, hasPhoto }: { busy: boolean; hasPhoto: boolean }): string {
  if (busy) return strings.admin.venuePhotoUploading;
  return hasPhoto ? strings.admin.venuePhotoReplace : strings.admin.venuePhotoUpload;
}

/**
 * The storage object to delete with a venue, or null. Only an uploaded photo (a bucket key) is removed; a photo
 * that ships with the app (`/venues/x.jpg`) belongs to the deploy, not to the venue.
 */
export function venuePhotoObjectToRemove(imagePath: string | null | undefined): string | null {
  if (!imagePath?.startsWith(VENUE_PHOTO_KEY_PREFIX)) return null;
  return imagePath;
}
