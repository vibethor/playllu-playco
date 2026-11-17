/**
 * Open a date / time input's own picker when the field is clicked, not only its small calendar icon (owner,
 * 17 Nov 2026: "when I put the time, open a calendar small popup to select the date and time, now I have to
 * write it in").
 *
 * `showPicker()` exists in every current browser but throws when it is not allowed (no user gesture, a
 * cross-origin frame, a disabled field). Typing still works then, so the error is swallowed on purpose: there is
 * nothing to recover and nothing for anyone to read.
 */
export function openNativePicker(input: Pick<HTMLInputElement, "showPicker"> & { disabled?: boolean }): boolean {
  if (input.disabled || typeof input.showPicker !== "function") return false;
  try {
    input.showPicker();
    return true;
  } catch {
    return false;
  }
}
