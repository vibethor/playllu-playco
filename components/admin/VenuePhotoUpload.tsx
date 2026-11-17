"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PhotoUpload } from "@/components/account/PhotoUpload";
import { venuePhotoControlLabel } from "@/lib/admin/venues/photo";
import { strings } from "@/lib/strings";

/**
 * Upload a photograph of the pitch, with a drag-crop (round 30, item 1).
 *
 * ~~NO CLIENT-SIDE CROP, unlike the avatar. A pitch is landscape and the panel
 * is landscape; cropping to a square here would throw away the goalposts.~~
 * REVERSED, and the reasoning was half right. Nothing here ever cropped to a
 * SQUARE — that was the avatar's problem, not this one — and the conclusion
 * drawn from it was that no crop was needed at all. What actually happened is
 * that `object-cover` took the middle of whatever was uploaded, and an
 * organizer photographing a pitch on a phone got a centre crop of a portrait
 * frame: sky and grass, no goal. The fix is the same layer the banner has,
 * framed to the venue's own 16:9 rather than to a square.
 *
 * IT IS NOW A THIN WRAPPER, and that is the point. `PhotoUpload` already owned
 * the size limit, the type allow-list, the claim-the-path-first ordering, the
 * cache-buster and the cropper; this file had its own copy of the first four
 * and none of the fifth. Two implementations of "upload an image" is how one
 * of them ends up without a crop for a year.
 *
 * RESTYLED, NOT REWIRED (round 42, the admin rebuild): the preview is drawn at
 * the card's own 1600×740 frame across its column, with an empty frame of the
 * same shape when there is no photo yet. The upload itself — `PhotoUpload`,
 * its cropper, `cacheControl: "0"`, the versioned URL and the
 * `venuePhotoChangedAction` it waits for — is untouched.
 *
 * Admin copy is English only — see `lib/i18n/locales.ts`.
 */
export function VenuePhotoUpload({
  venueId,
  hasPhoto,
  photoUrl = null,
  emptyFrame = true,
}: {
  venueId: string;
  hasPhoto: boolean;
  /**
   * The photo as players see it, version and all (round 41). Without it the
   * row said only "Photo set", so an organizer who replaced a photo had to
   * open a game to find out whether it took.
   */
  photoUrl?: string | null;
  /**
   * Whether to draw the empty frame when there is no photo. False on the
   * create form, which is never handed a preview — a frame saying "no photo
   * yet" would go on saying it after the upload.
   */
  emptyFrame?: boolean;
}) {
  /*
   * THE NEW PHOTO, SHOWN THE MOMENT IT IS STORED (owner, 17 Nov 2026: "keeps loading", on an iPhone). The create
   * form is never handed a `photoUrl`, so after an upload this step looked exactly as it did before one: the button
   * faded while the photo went up, then read "Upload a photo" again. The uploaded image is kept as a local preview,
   * and the button says what it is doing.
   */
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  const venueHasPhoto = hasPhoto || preview !== null;

  return (
    <div data-testid="venue-photo-upload">
      <p className="m-0 text-small font-semibold text-bone">{strings.admin.venuePhotoTitle}</p>

      {/* The server's photo first (it is versioned, so a replacement shows on the refresh); the local preview
          covers the create form, which is never handed one. */}
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt=""
          width={440}
          height={204}
          sizes="(min-width: 768px) 440px, 100vw"
          data-testid="venue-photo-preview"
          className="mt-2 aspect-[1600/740] w-full rounded-control border border-hairline object-cover"
        />
      ) : preview ? (
        <Image
          src={preview}
          alt=""
          width={440}
          height={204}
          unoptimized
          data-testid="venue-photo-preview"
          className="mt-2 aspect-[1600/740] w-full rounded-control border border-hairline object-cover"
        />
      ) : emptyFrame ? (
        <div className="mt-2 flex aspect-[1600/740] w-full items-center justify-center rounded-control border border-dashed border-hairline-strong bg-surface text-[12px] text-faint">
          {strings.admin.pitch.photoEmpty}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <PhotoUpload
          target="venue"
          venueId={venueId}
          hasPhoto={venueHasPhoto}
          onUploaded={(photo) => setPreview(URL.createObjectURL(photo))}
        >
          {({ busy }) => (
            <span
              data-testid="venue-photo-control"
              aria-busy={busy || undefined}
              className="inline-flex min-h-11 items-center rounded-control border border-hairline-strong px-4 text-small font-semibold text-accent transition-colors hover:border-hairline-accent active:border-hairline-accent"
            >
              {venuePhotoControlLabel({ busy, hasPhoto: venueHasPhoto })}
            </span>
          )}
        </PhotoUpload>
        {preview && (
          <p role="status" data-testid="venue-photo-saved" className="m-0 text-small text-accent">
            {strings.admin.venuePhotoSaved}
          </p>
        )}
      </div>

      <p className="mb-0 mt-2 text-[12px] leading-snug text-muted">
        {strings.admin.venuePhotoHint}
      </p>
    </div>
  );
}
