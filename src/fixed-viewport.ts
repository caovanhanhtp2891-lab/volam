// Prevent pinch magnification while retaining single-finger scrolling and
// normal input focus. The viewport meta tag and 16px fields handle focus zoom.
export function installFixedViewport(): void {
  const prevent = (event: Event) => event.preventDefault();
  document.addEventListener("gesturestart", prevent, { passive: false });
  document.addEventListener("gesturechange", prevent, { passive: false });
  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 1) event.preventDefault();
    },
    { passive: false },
  );
}
