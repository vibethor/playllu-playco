import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined }) }));
vi.mock("@/app/admin/venues/actions", () => ({ venuePhotoChangedAction: async () => undefined }));
vi.mock("@/app/account/actions", () => ({ profilePhotoChangedAction: async () => undefined }));

const { PhotoUpload } = await import("@/components/account/PhotoUpload");

/**
 * THE CONTROL CAN SAY IT IS BUSY (owner, 17 Nov 2026). A caller that draws its own button, as the venue photo
 * does, used to get only a fade while the photo went up. Children may now be a function of the upload state.
 */
describe("PhotoUpload", () => {
  it("hands the upload state to children given as a function", () => {
    // Act
    const html = renderToStaticMarkup(
      <PhotoUpload target="venue" venueId="venue-1" hasPhoto={false}>
        {({ busy }) => <span data-testid="label">{busy ? "uploading" : "ready"}</span>}
      </PhotoUpload>,
    );

    // Assert
    expect(html).toContain('<span data-testid="label">ready</span>');
  });
});
