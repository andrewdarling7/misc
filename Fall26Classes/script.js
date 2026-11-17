const COURSES = ["MT5003", "SS5003", "BEL6201", "SL5003", "EH5003", "DT5003", "PT5003"];
const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const COUNTS_CACHE_KEY = "fall26ClassCountsCacheV1";
const countsByCourse = Object.fromEntries(COURSES.map((course) => [course, null]));

const connectButton = document.getElementById("changeButton");
const statusMessage = document.getElementById("calendarStatus");
let tokenClient = null;
let isSyncing = false;
let calendarPermissionGranted = localStorage.getItem("fall26CalendarReadOnlyGranted") === "true";

function readCountsCache() {
  try {
    const rawCache = localStorage.getItem(COUNTS_CACHE_KEY);
    if (!rawCache) return null;

    const cache = JSON.parse(rawCache);
    const config = window.FALL26_CALENDAR_CONFIG;
    if (!cache || !cache.counts || !cache.syncedAt ||
        cache.calendarId !== config.calendarId ||
        cache.endExclusive !== config.endExclusive ||
        Number.isNaN(Date.parse(cache.syncedAt))) {
      return null;
    }

    for (const course of COURSES) {
      if (!Number.isInteger(cache.counts[course]) || cache.counts[course] < 0) {
        return null;
      }
    }

    return cache;
  } catch {
    return null;
  }
}

function saveCountsCache(counts, syncedAt) {
  try {
    localStorage.setItem(COUNTS_CACHE_KEY, JSON.stringify({
      counts,
      syncedAt: syncedAt.toISOString(),
      calendarId: window.FALL26_CALENDAR_CONFIG.calendarId,
      endExclusive: window.FALL26_CALENDAR_CONFIG.endExclusive,
    }));
    return true;
  } catch {
    return false;
  }
}

function formatSyncTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function renderCounts() {
  for (const course of COURSES) {
    const countElement = document.getElementById(course);
    countElement.textContent = countsByCourse[course] === null ? "—" : countsByCourse[course];
  }
}

function setStatus(message, state) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state || "idle";
}

function clientIdIsConfigured() {
  return window.FALL26_CALENDAR_CONFIG &&
    window.FALL26_CALENDAR_CONFIG.clientId &&
    !window.FALL26_CALENDAR_CONFIG.clientId.startsWith("YOUR_");
}

function initializeTokenClient() {
  if (!window.google || !google.accounts || !google.accounts.oauth2) {
    return false;
  }

  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: window.FALL26_CALENDAR_CONFIG.clientId,
      scope: CALENDAR_SCOPE,
      callback: async (response) => {
        if (response.error) {
          setStatus("Google Calendar access was not granted. Tap to try again.", "error");
          isSyncing = false;
          connectButton.disabled = false;
          return;
        }

        calendarPermissionGranted = true;
        localStorage.setItem("fall26CalendarReadOnlyGranted", "true");
        await syncCalendar(response.access_token);
      },
      error_callback: (error) => {
        setStatus(error.message || "Google sign-in could not open. Tap to try again.", "error");
        isSyncing = false;
        connectButton.disabled = false;
      },
    });
  }

  return true;
}

async function fetchRemainingClassCounts(accessToken) {
  const config = window.FALL26_CALENDAR_CONFIG;
  const now = new Date();
  const endExclusive = new Date(config.endExclusive);
  const counts = Object.fromEntries(COURSES.map((course) => [course, 0]));

  if (now >= endExclusive) {
    return counts;
  }

  let pageToken = "";
  do {
    const url = new URL(
      CALENDAR_API + "/" + encodeURIComponent(config.calendarId) + "/events"
    );
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("showDeleted", "false");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "250");
    url.searchParams.set("timeMin", now.toISOString());
    url.searchParams.set("timeMax", config.endExclusive);
    url.searchParams.set("timeZone", config.timeZone);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + accessToken },
    });
    if (!response.ok) {
      throw new Error(response.status === 401
        ? "Google authorization expired. Tap Sync to reconnect."
        : "Google Calendar could not be read (" + response.status + ").");
    }

    const data = await response.json();
    for (const event of data.items || []) {
      if (event.status !== "confirmed" || !event.recurringEventId) continue;

      const title = event.summary || "";
      const course = COURSES.find((id) => title.startsWith(id));
      if (course) counts[course] += 1;
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return counts;
}

async function syncCalendar(accessToken) {
  setStatus("Loading class events…", "loading");
  try {
    const counts = await fetchRemainingClassCounts(accessToken);
    Object.assign(countsByCourse, counts);
    renderCounts();

    const syncedAt = new Date();
    const savedLocally = saveCountsCache(counts, syncedAt);
    const syncedTime = formatSyncTime(syncedAt.toISOString());
    setStatus(savedLocally
      ? "Saved on this device · synced " + syncedTime
      : "Calendar synced " + syncedTime + " · could not save on this device",
    savedLocally ? "success" : "error");
    connectButton.textContent = "Sync";
  } catch (error) {
    setStatus(error.message || "Could not load Google Calendar.", "error");
  } finally {
    isSyncing = false;
    connectButton.disabled = false;
  }
}

connectButton.addEventListener("click", () => {
  if (isSyncing) return;

  if (!clientIdIsConfigured()) {
    setStatus("Add your Google OAuth client ID to calendar-config.js first.", "setup");
    return;
  }

  if (!initializeTokenClient()) {
    setStatus("Google sign-in is still loading. Please tap Sync again in a moment.", "loading");
    return;
  }

  isSyncing = true;
  connectButton.disabled = true;
  setStatus("Opening Google sign-in…", "loading");
  tokenClient.requestAccessToken({ prompt: calendarPermissionGranted ? "" : "consent" });
});

renderCounts();
const savedCounts = readCountsCache();
if (savedCounts) {
  Object.assign(countsByCourse, savedCounts.counts);
  renderCounts();
}

if (clientIdIsConfigured()) {
  if (savedCounts) {
    setStatus("Saved on this device · last synced " + formatSyncTime(savedCounts.syncedAt), "success");
    connectButton.textContent = "Sync";
  } else {
    setStatus("Connect to Google Calendar to load remaining class counts.", "idle");
    connectButton.textContent = "Connect calendar";
  }
} else {
  setStatus("Calendar connection setup is needed before counts can load.", "setup");
  connectButton.textContent = "Connect calendar";
}
