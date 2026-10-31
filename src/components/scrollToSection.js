"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollToSection = scrollToSection;
/**
 * Scrolls to an in-page section.
 *
 * Content that lives inside the pinned cinematic stage (the About page) is
 * fixed at the top of the viewport for the whole pin, so its layout position is
 * useless as a scroll target. For those, aim at the end of the pin instead,
 * where the reveal has finished and the section fills the screen.
 */
function scrollToSection(id) {
    var target = document.getElementById(id);
    if (!target)
        return;
    var pinnedRoot = target.closest(".cine");
    var spacer = pinnedRoot === null || pinnedRoot === void 0 ? void 0 : pinnedRoot.parentElement;
    if (pinnedRoot && (spacer === null || spacer === void 0 ? void 0 : spacer.classList.contains("pin-spacer"))) {
        var travel = Math.max(0, spacer.offsetHeight - pinnedRoot.offsetHeight);
        window.scrollTo({
            top: spacer.offsetTop + travel * 0.97,
            behavior: "smooth",
        });
        return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
}
