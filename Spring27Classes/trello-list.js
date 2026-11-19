(() => {
  "use strict";
  const API_KEY="0668b6c6aba18f5b6625af8d78dd9bdc";
  const TOKEN_KEY="classesDashboardTrelloReadTokenV1";
  const CALLBACK=new URL("trello-auth.html",window.location.href).href;
  const RETURN_KEY="classesDashboardTrelloReturnPathV1";
  function message(box,text,kind=""){box.replaceChildren();const p=document.createElement("p");p.className="trello-status"+(kind?" "+kind:"");p.textContent=text;box.append(p);}
  function connect(box){
    try{sessionStorage.setItem(RETURN_KEY,location.pathname+location.search);}catch(_){}
    const url=new URL("https://trello.com/1/authorize");
    url.search=new URLSearchParams({expiration:"never",name:"Classes Dashboard",scope:"read",response_type:"token",key:API_KEY,return_url:CALLBACK,callback_method:"fragment"}).toString();
    const a=document.createElement("a");a.className="trello-connect";a.href=url.href;a.textContent="Connect Trello to view this list";box.replaceChildren(a);
  }
  function render(box,cards){
    if(!cards.length){message(box,"No open cards in this list.");return;}
    const ul=document.createElement("ul");ul.className="trello-cards";
    cards.forEach(card=>{const li=document.createElement("li"),a=document.createElement("a");a.href=card.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=card.name;li.append(a);if(card.due){const time=document.createElement("time");time.className="trello-due";time.dateTime=card.due;time.textContent=new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(card.due));li.append(time);}ul.append(li);});
    box.replaceChildren(ul);
  }
  async function load(box,token){
    const url=new URL("https://api.trello.com/1/lists/"+encodeURIComponent(box.dataset.trelloListId)+"/cards");
    url.search=new URLSearchParams({filter:"open",fields:"name,due,dueComplete,url",key:API_KEY,token}).toString();
    try{
      const response=await fetch(url,{headers:{Accept:"application/json"}});
      if(response.status===401||response.status===403){localStorage.removeItem(TOKEN_KEY);connect(box);const p=document.createElement("p");p.className="trello-status";p.textContent="Your Trello connection needs to be renewed.";box.prepend(p);return;}
      if(!response.ok)throw new Error("Trello request failed");
      const cards=await response.json(),skip=new Set(["NEXT CLASS","NEXT NEXT CLASS"]);
      render(box,cards.filter(card=>!skip.has((card.name||"").trim().replace(/\s+/g," ").toUpperCase())));
    }catch(_){message(box,"Could not load this Trello list. Check your connection and try again.","is-error");}
  }
  document.querySelectorAll("[data-trello-list-id]").forEach(box=>{let token="";try{token=localStorage.getItem(TOKEN_KEY)||"";}catch(_){}token?load(box,token):connect(box);});
})();