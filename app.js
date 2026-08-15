const PAGE_SIZE = 18;
const screenshotBase = "https://s.wordpress.com/mshots/v1/";

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem("devfolio-saved") || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch (_) {
    return new Set();
  }
}

const state = {
  portfolios: [],
  filtered: [],
  activeFilter: "all",
  query: "",
  sort: "featured",
  visible: PAGE_SIZE,
  saved: loadSaved(),
};

const elements = {
  grid: document.querySelector("#portfolioGrid"),
  resultCount: document.querySelector("#resultCount"),
  search: document.querySelector("#searchInput"),
  category: document.querySelector("#categorySelect"),
  sort: document.querySelector("#sortSelect"),
  loadMore: document.querySelector("#loadMoreButton"),
  empty: document.querySelector("#emptyState"),
  clear: document.querySelector("#clearButton"),
  surprise: document.querySelector("#surpriseButton"),
  totalStat: document.querySelector("#totalStat"),
  roleStat: document.querySelector("#roleStat"),
  savedOption: document.querySelector("#savedOption"),
};

const categoryPatterns = {
  frontend: /front[ -]?end|react|vue|angular|javascript|typescript|web developer/i,
  fullstack: /full[ -]?stack|mern|mean stack/i,
  backend: /back[ -]?end|devops|cloud|site reliability|infrastructure|platform engineer/i,
  mobile: /mobile|android|ios|flutter|react native/i,
  design: /design|ux|ui\/ux|product designer|creative developer/i,
  ai: /artificial intelligence|\bai\b|machine learning|\bml\b|data scien|data engineer/i,
};

function normalizePortfolio(item, index) {
  let domain = item.url;
  try { domain = new URL(item.url).hostname.replace(/^www\./, ""); } catch (_) {}
  return { ...item, id: `${index}-${item.url}`, domain, index };
}

function matchesFilter(item) {
  if (state.activeFilter === "all") return true;
  if (state.activeFilter === "saved") return state.saved.has(item.url);
  return categoryPatterns[state.activeFilter].test(item.tagline || "");
}

function stableRandomValue(item) {
  let hash = 2166136261;
  for (const char of `${item.name}${item.url}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function applyFilters() {
  const query = state.query.trim().toLocaleLowerCase();
  state.filtered = state.portfolios.filter((item) => {
    const text = `${item.name} ${item.tagline || ""} ${item.domain}`.toLocaleLowerCase();
    return matchesFilter(item) && (!query || text.includes(query));
  });

  if (state.sort === "az") state.filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (state.sort === "za") state.filtered.sort((a, b) => b.name.localeCompare(a.name));
  if (state.sort === "random") state.filtered.sort((a, b) => stableRandomValue(a) - stableRandomValue(b));

  render();
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function screenshotUrl(url) {
  return `${screenshotBase}${encodeURIComponent(url)}?w=640&h=420`;
}

function createCard(item, cardIndex) {
  const article = document.createElement("article");
  article.className = "portfolio-card";
  article.style.animationDelay = `${Math.min(cardIndex % PAGE_SIZE, 8) * 35}ms`;

  const preview = document.createElement("div");
  preview.className = "preview";

  const image = document.createElement("img");
  image.className = "preview-image";
  image.src = screenshotUrl(item.url);
  image.alt = `Preview of ${item.name}'s portfolio`;
  image.loading = "lazy";
  image.decoding = "async";
  image.width = 640;
  image.height = 420;
  image.addEventListener("load", () => image.classList.add("is-loaded"));
  image.addEventListener("error", () => {
    image.remove();
    preview.classList.add("preview-failed");
  });

  const placeholder = document.createElement("div");
  placeholder.className = "preview-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  const initialsElement = document.createElement("span");
  initialsElement.textContent = initials(item.name);
  placeholder.append(initialsElement);

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = `card-save${state.saved.has(item.url) ? " is-saved" : ""}`;
  saveButton.setAttribute("aria-label", `${state.saved.has(item.url) ? "Remove" : "Save"} ${item.name}`);
  saveButton.setAttribute("aria-pressed", String(state.saved.has(item.url)));
  saveButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>';
  saveButton.addEventListener("click", () => toggleSaved(item, saveButton));

  preview.append(image, placeholder, saveButton);

  const body = document.createElement("div");
  body.className = "card-body";
  const topline = document.createElement("div");
  topline.className = "card-topline";
  const title = document.createElement("h3");
  title.textContent = item.name;
  title.title = item.name;
  const domain = document.createElement("span");
  domain.className = "domain";
  domain.textContent = item.domain;
  domain.title = item.domain;
  topline.append(title, domain);

  const tagline = document.createElement("p");
  tagline.className = "tagline";
  tagline.textContent = item.tagline || "Developer portfolio";

  const visit = document.createElement("a");
  visit.className = "visit-link";
  visit.href = item.url;
  visit.target = "_blank";
  visit.rel = "noopener noreferrer";
  visit.setAttribute("aria-label", `Visit ${item.name}'s portfolio (opens in a new tab)`);
  visit.innerHTML = 'View portfolio <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

  body.append(topline, tagline, visit);
  article.append(preview, body);
  return article;
}

function toggleSaved(item, button) {
  if (state.saved.has(item.url)) state.saved.delete(item.url);
  else state.saved.add(item.url);
  localStorage.setItem("devfolio-saved", JSON.stringify([...state.saved]));
  const isSaved = state.saved.has(item.url);
  button.classList.toggle("is-saved", isSaved);
  button.setAttribute("aria-pressed", String(isSaved));
  button.setAttribute("aria-label", `${isSaved ? "Remove" : "Save"} ${item.name}`);
  updateSavedCount();
  if (state.activeFilter === "saved") applyFilters();
}

function render() {
  const visibleItems = state.filtered.slice(0, state.visible);
  const fragment = document.createDocumentFragment();
  visibleItems.forEach((item, index) => fragment.append(createCard(item, index)));
  elements.grid.replaceChildren(fragment);
  elements.grid.setAttribute("aria-busy", "false");
  elements.empty.hidden = state.filtered.length !== 0;
  elements.grid.hidden = state.filtered.length === 0;
  elements.loadMore.hidden = state.visible >= state.filtered.length;
  elements.resultCount.textContent = `${state.filtered.length.toLocaleString()} portfolio${state.filtered.length === 1 ? "" : "s"}`;
}

function setFilter(filter) {
  state.activeFilter = filter;
  state.visible = PAGE_SIZE;
  elements.category.value = filter;
  applyFilters();
}

function clearFilters() {
  state.query = "";
  state.sort = "featured";
  elements.search.value = "";
  elements.sort.value = "featured";
  setFilter("all");
  elements.search.focus();
}

function updateSavedCount() {
  elements.savedOption.textContent = `Saved (${state.saved.size.toLocaleString()})`;
}

elements.category.addEventListener("change", (event) => {
  setFilter(event.target.value);
});

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  state.visible = PAGE_SIZE;
  applyFilters();
});

elements.sort.addEventListener("change", (event) => {
  state.sort = event.target.value;
  state.visible = PAGE_SIZE;
  applyFilters();
});

elements.loadMore.addEventListener("click", () => {
  state.visible += PAGE_SIZE;
  render();
});

elements.clear.addEventListener("click", clearFilters);
elements.surprise.addEventListener("click", () => {
  if (!state.portfolios.length) return;
  const item = state.portfolios[Math.floor(Math.random() * state.portfolios.length)];
  window.open(item.url, "_blank", "noopener,noreferrer");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    elements.search.focus();
  }
  if (event.key === "Escape" && document.activeElement === elements.search) {
    elements.search.value = "";
    state.query = "";
    applyFilters();
    elements.search.blur();
  }
});

async function init() {
  updateSavedCount();
  try {
    const response = await fetch("./feed.json");
    if (!response.ok) throw new Error(`Unable to load feed (${response.status})`);
    const data = await response.json();
    state.portfolios = data.map(normalizePortfolio);
    state.filtered = [...state.portfolios];
    if (elements.totalStat) elements.totalStat.textContent = state.portfolios.length.toLocaleString();
    if (elements.roleStat) elements.roleStat.textContent = state.portfolios.filter((item) => item.tagline).length.toLocaleString();
    applyFilters();
  } catch (error) {
    elements.grid.replaceChildren();
    elements.grid.hidden = true;
    elements.empty.hidden = false;
    elements.empty.querySelector("h3").textContent = "Could not load the directory";
    elements.empty.querySelector("p").textContent = "Serve this folder through a local web server or deploy it to GitHub Pages.";
    elements.clear.hidden = true;
    elements.resultCount.textContent = "Feed unavailable";
    console.error(error);
  }
}

init();
