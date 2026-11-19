(() => {
  "use strict";
  const KEY = "spring27ClassCountsCacheV1";
  let cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { return; }
  if (!cache || !cache.counts || !cache.syncedAt || Number.isNaN(Date.parse(cache.syncedAt))) return;
  document.querySelectorAll("[data-course-count-for]").forEach(badge => {
    const count = cache.counts[badge.dataset.courseCountFor];
    if (!Number.isInteger(count) || count < 0) return;
    const value = badge.querySelector("[data-count-value]");
    if (!value) return;
    value.textContent = String(count);
    badge.hidden = false;
    const synced = new Intl.DateTimeFormat(undefined, {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(cache.syncedAt));
    badge.setAttribute("aria-label", count + " class meetings remaining, last synced " + synced);
    badge.title = "From dashboard sync on " + synced;
  });
})();