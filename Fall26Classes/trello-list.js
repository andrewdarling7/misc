(() => {
  "use strict";

  const API_KEY = "0668b6c6aba18f5b6625af8d78dd9bdc";
  const TOKEN_KEY = "classesDashboardTrelloReadTokenV1";
  const CALLBACK = new URL("trello-auth.html", window.location.href).href;
  const AUTH_RETURN_KEY = "classesDashboardTrelloReturnPathV1";

  function setMessage(container, message, kind = "") {
    container.replaceChildren();
    const p = document.createElement("p");
    p.className = "trello-status" + (kind ? " " + kind : "");
    p.textContent = message;
    container.append(p);
  }

  function connect(container) {
    try {
      sessionStorage.setItem(AUTH_RETURN_KEY, window.location.pathname + window.location.search);
    } catch (_) {}
    const url = new URL("https://trello.com/1/authorize");
    url.search = new URLSearchParams({
      expiration: "never",
      name: "Classes Dashboard",
      scope: "read",
      response_type: "token",
      key: API_KEY,
      return_url: CALLBACK,
      callback_method: "fragment"
    }).toString();

    const link = document.createElement("a");
    link.className = "trello-connect";
    link.href = url.href;
    link.textContent = "Connect Trello to view this list";
    container.replaceChildren(link);
  }

  function renderCards(container, cards) {
    if (!cards.length) {
      setMessage(container, "No open cards in this list.");
      return;
    }

    const list = document.createElement("ul");
    list.className = "trello-cards";
    cards.forEach(card => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = card.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = card.name;
      item.append(link);

      if (card.due) {
        const due = document.createElement("time");
        due.className = "trello-due";
        due.dateTime = card.due;
        due.textContent = new Intl.DateTimeFormat(undefined, {
          month: "short", day: "numeric", year: "numeric"
        }).format(new Date(card.due));
        item.append(due);
      }
      list.append(item);
    });
    container.replaceChildren(list);
  }

  async function loadList(container, token) {
    const listId = container.dataset.trelloListId;
    const endpoint = new URL("https://api.trello.com/1/lists/" + encodeURIComponent(listId) + "/cards");
    endpoint.search = new URLSearchParams({
      filter: "open",
      fields: "name,due,dueComplete,url",
      key: API_KEY,
      token
    }).toString();

    try {
      const response = await fetch(endpoint.href, { headers: { Accept: "application/json" } });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        connect(container);
        const note = document.createElement("p");
        note.className = "trello-status";
        note.textContent = "Your Trello connection needs to be renewed.";
        container.prepend(note);
        return;
      }
      if (!response.ok) throw new Error("Trello request failed");
      const cards = await response.json();
      const markerNames = new Set(["NEXT CLASS", "NEXT NEXT CLASS"]);
      const visibleCards = cards.filter(card => {
        const normalizedName = (card.name || "").trim().replace(/\s+/g, " ").toUpperCase();
        return !markerNames.has(normalizedName);
      });
      renderCards(container, visibleCards);
    } catch (_) {
      setMessage(container, "Could not load this Trello list. Check your connection and try again.", "is-error");
    }
  }

  document.querySelectorAll("[data-trello-list-id]").forEach(container => {
    let token = "";
    try { token = localStorage.getItem(TOKEN_KEY) || ""; } catch (_) {}
    if (token) loadList(container, token);
    else connect(container);
  });
})();