const COURSES = ["MT5004","SS5004","BEL6202","SL5004","CL5004","PT5004","DT5004"];
const API = "https://www.googleapis.com/calendar/v3/calendars";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const CACHE_KEY = "spring27ClassCountsCacheV1";
const PERMISSION_KEY = "fall26CalendarReadOnlyGranted";
const counts = Object.fromEntries(COURSES.map(id => [id,null]));
const button = document.getElementById("changeButton");
const status = document.getElementById("calendarStatus");
let tokenClient = null;
let syncing = false;
let permissionGranted = localStorage.getItem(PERMISSION_KEY) === "true";

function showCounts() {
  COURSES.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = counts[id] === null ? "—" : counts[id];
  });
}
function setStatus(message,state="idle") {
  status.textContent = message;
  status.dataset.state = state;
}
function formatTime(value) {
  return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));
}
function readCache() {
  try {
    const cache=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");
    const config=window.SPRING27_CALENDAR_CONFIG;
    if(!cache||!cache.counts||!cache.syncedAt||cache.calendarId!==config.calendarId||cache.endExclusive!==config.endExclusive||Number.isNaN(Date.parse(cache.syncedAt)))return null;
    for(const id of COURSES)if(!Number.isInteger(cache.counts[id])||cache.counts[id]<0)return null;
    return cache;
  } catch (_) { return null; }
}
function saveCache(values,syncedAt) {
  try {
    localStorage.setItem(CACHE_KEY,JSON.stringify({counts:values,syncedAt: syncedAt.toISOString(),calendarId:window.SPRING27_CALENDAR_CONFIG.calendarId,endExclusive:window.SPRING27_CALENDAR_CONFIG.endExclusive}));
    return true;
  } catch (_) { return false; }
}
async function fetchCounts(accessToken) {
  const config=window.SPRING27_CALENDAR_CONFIG, now=new Date(), end=new Date(config.endExclusive);
  const result=Object.fromEntries(COURSES.map(id=>[id,0]));
  if(now>=end)return result;
  let pageToken="";
  do {
    const url=new URL(API+"/"+encodeURIComponent(config.calendarId)+"/events");
    url.searchParams.set("singleEvents","true");
    url.searchParams.set("showDeleted","false");
    url.searchParams.set("orderBy","startTime");
    url.searchParams.set("maxResults","250");
    url.searchParams.set("timeMin",now.toISOString());
    url.searchParams.set("timeMax",config.endExclusive);
    url.searchParams.set("timeZone",config.timeZone);
    if(pageToken)url.searchParams.set("pageToken",pageToken);
    const response=await fetch(url,{headers:{Authorization:"Bearer "+accessToken}});
    if(!response.ok)throw new Error(response.status===401?"Google authorization expired. Tap Sync to reconnect.":"Google Calendar could not be read ("+response.status+").");
    const data=await response.json();
    for(const event of data.items||[]) {
      if(event.status!=="confirmed"||!event.recurringEventId)continue;
      const title=(event.summary||"").trim();
      const course=COURSES.find(id=>title.startsWith(id));
      if(course)result[course]++;
    }
    pageToken=data.nextPageToken||"";
  } while(pageToken);
  return result;
}
async function sync(accessToken) {
  setStatus("Loading class events…","loading");
  try {
    const values=await fetchCounts(accessToken);
    Object.assign(counts,values);
    showCounts();
    const syncedAt=new Date(),saved=saveCache(values,syncedAt);
    setStatus(saved?"Saved on this device · synced "+formatTime(syncedAt):"Calendar synced · could not save on this device",saved?"success":"error");
    button.textContent="Sync";
  } catch(error) { setStatus(error.message||"Could not load Google Calendar.","error"); }
  finally { syncing=false; button.disabled=false; }
}
function initializeTokenClient() {
  if(!window.google?.accounts?.oauth2)return false;
  if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:window.SPRING27_CALENDAR_CONFIG.clientId,
    scope:SCOPE,
    callback:async response=>{
      if(response.error){setStatus("Google Calendar access was not granted. Tap to try again.","error");syncing=false;button.disabled=false;return;}
      permissionGranted=true;
      localStorage.setItem(PERMISSION_KEY,"true");
      await sync(response.access_token);
    },
    error_callback:error=>{setStatus(error.message||"Google sign-in could not open. Tap to try again.","error");syncing=false;button.disabled=false;}
  });
  return true;
}
button.addEventListener("click",()=>{
  if(syncing)return;
  if(!window.SPRING27_CALENDAR_CONFIG?.clientId){setStatus("Calendar connection setup is needed before counts can load.","setup");return;}
  if(!initializeTokenClient()){setStatus("Google sign-in is still loading. Tap Sync again in a moment.","loading");return;}
  syncing=true;button.disabled=true;setStatus("Opening Google sign-in…","loading");
  tokenClient.requestAccessToken({prompt:permissionGranted?"":"consent"});
});
showCounts();
const cached=readCache();
if(cached){
  Object.assign(counts,cached.counts);showCounts();
  setStatus("Saved on this device · last synced "+formatTime(cached.syncedAt),"success");
  button.textContent="Sync";
} else {
  setStatus("Connect to Google Calendar to load remaining class counts.","idle");
  button.textContent="Connect calendar";
}