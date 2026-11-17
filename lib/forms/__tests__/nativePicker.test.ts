import { describe, expect, it, vi } from "vitest";
import { openNativePicker } from "@/lib/forms/nativePicker";

describe("openNativePicker", () => {
  it("opens the field's own picker", () => {
    // Arrange
    const showPicker = vi.fn();

    // Act
    const opened = openNativePicker({ showPicker });

    // Assert
    expect(opened).toBe(true);
    expect(showPicker).toHaveBeenCalledOnce();
  });

  it("leaves a disabled field closed", () => {
    // Arrange
    const showPicker = vi.fn();

    // Act
    const opened = openNativePicker({ showPicker, disabled: true });

    // Assert
    expect(opened).toBe(false);
    expect(showPicker).not.toHaveBeenCalled();
  });

  it("falls back to typing when the browser refuses to open it", () => {
    // Arrange
    const showPicker = vi.fn(() => {
      throw new DOMException("not allowed", "NotAllowedError");
    });

    // Act
    const opened = openNativePicker({ showPicker });

    // Assert
    expect(opened).toBe(false);
  });
});
