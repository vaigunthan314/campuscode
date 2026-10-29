/**
 * Scrolls to an in-page section.
 *
 * Content that lives inside the pinned cinematic stage (the About page) is
 * fixed at the top of the viewport for the whole pin, so its layout position is
 * useless as a scroll target. For those, aim at the end of the pin instead,
 * where the reveal has finished and the section fills the screen.
 */
export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const pinnedRoot = target.closest<HTMLElement>(".cine");
  const spacer = pinnedRoot?.parentElement;

  if (pinnedRoot && spacer?.classList.contains("pin-spacer")) {
    const travel = Math.max(0, spacer.offsetHeight - pinnedRoot.offsetHeight);
    window.scrollTo({
      top: spacer.offsetTop + travel * 0.97,
      behavior: "smooth",
    });
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}
