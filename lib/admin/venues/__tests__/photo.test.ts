import { describe, expect, it } from "vitest";
import { venuePhotoControlLabel, venuePhotoObjectToRemove } from "@/lib/admin/venues/photo";
import { strings } from "@/lib/strings";

/**
 * THE PHOTO STEP SAID NOTHING (owner, 17 Nov 2026: "when I click add new venue it keeps loading", on an iPhone).
 * After the crop was saved the control only faded to half opacity while the photo went up, and came back as
 * "Upload a photo" with no preview, so a finished upload looked exactly like one that never started.
 */
describe("venuePhotoControlLabel", () => {
  it("says the photo is uploading while it goes up", () => {
    // Act
    const label = venuePhotoControlLabel({ busy: true, hasPhoto: false });

    // Assert
    expect(label).toBe(strings.admin.venuePhotoUploading);
  });

  it("offers to replace the photo once the venue has one", () => {
    // Act
    const label = venuePhotoControlLabel({ busy: false, hasPhoto: true });

    // Assert
    expect(label).toBe(strings.admin.venuePhotoReplace);
  });

  it("offers an upload when the venue has no photo", () => {
    // Act
    const label = venuePhotoControlLabel({ busy: false, hasPhoto: false });

    // Assert
    expect(label).toBe(strings.admin.venuePhotoUpload);
  });
});

/**
 * DELETING A VENUE LEFT ITS PHOTO BEHIND. `admin_delete_venue` removes the row; the file in the public
 * `venue-photos` bucket stayed, with nothing pointing at it.
 */
describe("venuePhotoObjectToRemove", () => {
  it("returns the bucket key of an uploaded photo", () => {
    // Act
    const key = venuePhotoObjectToRemove("venues/6ed9ad2d-b637-473d-9390-cd8412f2045f.webp");

    // Assert
    expect(key).toBe("venues/6ed9ad2d-b637-473d-9390-cd8412f2045f.webp");
  });

  it("leaves a photo that ships with the app alone", () => {
    // Act
    const key = venuePhotoObjectToRemove("/venues/swish.jpg");

    // Assert
    expect(key).toBeNull();
  });

  it("has nothing to remove when the venue had no photo", () => {
    // Act
    const key = venuePhotoObjectToRemove(null);

    // Assert
    expect(key).toBeNull();
  });
});
