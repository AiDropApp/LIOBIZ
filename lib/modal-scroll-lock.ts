/** Lock page scroll while modals are open (works with Lenis smooth scroll). */

export const SCROLL_LOCK_EVENT = "liobiz:scroll-lock-change";

let lockCount = 0;
let savedScrollY = 0;

export function lockPageScroll(): () => void {
  lockCount += 1;
  if (lockCount === 1) {
    savedScrollY = window.scrollY;
    document.documentElement.classList.add("is-scroll-locked");
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    window.dispatchEvent(new CustomEvent(SCROLL_LOCK_EVENT, { detail: { locked: true } }));
  }
  return unlockPageScroll;
}

function unlockPageScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) return;

  document.documentElement.classList.remove("is-scroll-locked");
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, savedScrollY);
  window.dispatchEvent(new CustomEvent(SCROLL_LOCK_EVENT, { detail: { locked: false } }));
}
