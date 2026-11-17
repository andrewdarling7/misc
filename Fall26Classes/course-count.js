(() => {
  "use strict";

  const CACHE_KEY = "fall26ClassCountsCacheV1";

  let cache;
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  } catch (_) {
    return;
  }

  if (!cache || !cache.counts || !cache.syncedAt || Number.isNaN(Date.parse(cache.syncedAt))) return;

  document.querySelectorAll("[data-course-count-for]").forEach(badge => {
    const courseId = badge.dataset.courseCountFor;
    const count = cache.counts[courseId];
    if (!Number.isInteger(count) || count < 0) return;

    const value = badge.querySelector("[data-count-value]");
    if (!value) return;
    value.textContent = String(count);
    badge.hidden = false;

    const syncedAt = new Intl.DateTimeFormat(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    }).format(new Date(cache.syncedAt));
    badge.setAttribute("aria-label", count + " class meetings remaining, last synced " + syncedAt);
    badge.title = "From dashboard sync on " + syncedAt;
  });
})();