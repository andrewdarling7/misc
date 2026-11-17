const COURSES = ["MT5003", "SS5003", "BEL6201", "SL5003", "EH5003", "DT5003", "PT5003"];
const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const countsByCourse = Object.fromEntries(COURSES.map((course) => [course, null]));

const connectButton = document.getElementById("changeButton");
const statusMessage = document.getElementById("calendarStatus");
let tokenClient = null;
let isSyncing = false;

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
          connectButton.disabled = false;
          return;
        }

        await syncCalendar(response.access_token);
      },
      error_callback: (error) => {
        setStatus(error.message || "Google sign-in could not open. Tap to try again.", "error");
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
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
    setStatus("Calendar synced at " + time, "success");
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
  tokenClient.requestAccessToken({ prompt: "" });
});

renderCounts();
if (clientIdIsConfigured()) {
  setStatus("Connect to Google Calendar to load remaining class counts.", "idle");
  connectButton.textContent = "Connect calendar";
} else {
  setStatus("Calendar connection setup is needed before counts can load.", "setup");
  connectButton.textContent = "Connect calendar";
}
