import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * AN OLD TAB MUST NOT HANG ON A NEW DEPLOYMENT (owner, 16 and 17 Nov 2026: adding a venue, then saving a game,
 * "keeps loading"). Both saves reached the database in under a second, minutes after a new production deployment
 * went live. The admin page had been opened on the previous build; the new build answered the save with a page
 * built from module ids the old page does not have, and the old page waited for them for ever.
 *
 * Next.js handles exactly this when every deployment has its own id: a mismatch turns into a full reload. Vercel
 * gives each deployment an id at build time; the config passes it on.
 */
describe("next.config deploymentId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is the Vercel deployment's own id", async () => {
    // Arrange
    vi.stubEnv("VERCEL_DEPLOYMENT_ID", "dpl_TestDeployment123");

    // Act
    const config = (await import("@/next.config")).default;

    // Assert
    expect(config.deploymentId).toBe("dpl_TestDeployment123");
  });

  it("is left unset outside Vercel, where there is one server and no skew", async () => {
    // Arrange
    vi.stubEnv("VERCEL_DEPLOYMENT_ID", "");

    // Act
    const config = (await import("@/next.config")).default;

    // Assert
    expect(config.deploymentId).toBeUndefined();
  });
});
