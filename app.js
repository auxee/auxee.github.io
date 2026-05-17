import { baseLayerLuminance, StandardLuminance } from "https://unpkg.com/@fluentui/web-components";

const REPO_JSON_URL = "https://raw.githubusercontent.com/auxee/AuxDalamudRepo/main/repo.json";

const LISTING_INFO = {
  name: "Aux Plugins",
  description: "",
  authorName: "Auxie",
  authorUrl: "https://github.com/auxee",
  bannerImageUrl: ""
};

const state = {
  plugins: [],
  filteredPlugins: [],
  query: ""
};

const isDarkTheme = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const setTheme = () => {
  if (isDarkTheme()) {
    baseLayerLuminance.setValueFor(document.documentElement, StandardLuminance.DarkMode);
  } else {
    baseLayerLuminance.setValueFor(document.documentElement, StandardLuminance.LightMode);
  }
};

const toUpdatedText = (unixSeconds) => {
  const value = Number(unixSeconds);
  if (!Number.isFinite(value) || value <= 0) {
    return "Unknown";
  }

  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const escapeHtml = (text) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizePlugin = (plugin) => {
  const tags = Array.isArray(plugin.Tags) ? plugin.Tags : [];
  const name = plugin.Name ?? plugin.InternalName ?? "Unnamed Plugin";
  const internalName = plugin.InternalName ?? "unknown.plugin";
  const punchline = plugin.Punchline ?? "";
  const description = plugin.Description ?? "No description provided.";
  const author = plugin.Author ?? "Unknown";
  const apiLevel = plugin.DalamudApiLevel ?? "Unknown";
  const version = plugin.AssemblyVersion ?? "Unknown";
  const applicableVersion = plugin.ApplicableVersion ?? "Unknown";
  const repoUrl = plugin.RepoUrl ?? "#";
  const iconUrl = plugin.IconUrl ?? "";
  const downloadUrl = plugin.DownloadLinkInstall ?? plugin.DownloadLinkUpdate ?? "#";
  const updatedText = toUpdatedText(plugin.LastUpdate);

  return {
    raw: plugin,
    name,
    internalName,
    punchline,
    description,
    tags,
    author,
    apiLevel,
    version,
    applicableVersion,
    repoUrl,
    iconUrl,
    downloadUrl,
    updatedText,
    searchText: [
      name,
      internalName,
      punchline,
      description,
      tags.join(" ")
    ].join(" ").toLowerCase()
  };
};

const showStatus = (message) => {
  const status = document.getElementById("gridStatus");
  status.textContent = message;
};

const setListingHeader = () => {
  document.getElementById("listingTitle").textContent = LISTING_INFO.name;
  document.getElementById("listingDescription").textContent = LISTING_INFO.description;

  const publisherLink = document.getElementById("publisherLink");
  publisherLink.textContent = LISTING_INFO.authorName;
  publisherLink.href = LISTING_INFO.authorUrl;

  if (LISTING_INFO.bannerImageUrl) {
    const banner = document.getElementById("bannerImage");
    banner.classList.remove("hidden");
    banner.style.backgroundImage = `url(${LISTING_INFO.bannerImageUrl})`;
  }
};

const applySearchFilter = () => {
  const query = state.query.trim().toLowerCase();
  if (!query) {
    state.filteredPlugins = [...state.plugins];
  } else {
    state.filteredPlugins = state.plugins.filter((plugin) => plugin.searchText.includes(query));
  }
};

const createCell = (content, options = {}) => {
  const cell = document.createElement("fluent-data-grid-cell");
  cell.setAttribute("cell-type", options.cellType ?? "default");
  if (options.className) {
    cell.className = options.className;
  }

  if (options.html) {
    cell.innerHTML = content;
  } else {
    cell.textContent = content;
  }

  return cell;
};

const createIconFallback = (pluginName) => {
  const fallback = document.createElement("div");
  fallback.className = "pluginIconFallback";
  fallback.setAttribute("aria-hidden", "true");
  fallback.textContent = (pluginName?.charAt(0) ?? "?").toUpperCase();
  return fallback;
};

const hideRowMenu = () => {
  const menu = document.getElementById("rowMoreMenu");
  menu.classList.add("hidden");
};

const openRowMenu = (event, plugin) => {
  event.stopPropagation();

  const menu = document.getElementById("rowMoreMenu");
  const repoLink = document.getElementById("rowMoreRepoLink");
  const downloadLink = document.getElementById("rowMoreDownloadLink");

  repoLink.href = plugin.repoUrl;
  downloadLink.href = plugin.downloadUrl;
  menu.style.top = `${event.clientY + 8}px`;
  menu.style.left = `${Math.max(event.clientX - 160, 8)}px`;
  menu.classList.remove("hidden");
};

const openPluginDialog = (plugin) => {
  const dialog = document.getElementById("pluginDialog");
  document.getElementById("pluginDialogName").textContent = plugin.name;
  document.getElementById("pluginDialogVersion").textContent = `v${plugin.version}`;
  document.getElementById("pluginDialogPunchline").textContent = plugin.punchline;
  document.getElementById("pluginDialogDescription").textContent = plugin.description;
  document.getElementById("pluginDialogInternalName").textContent = plugin.internalName;
  document.getElementById("pluginDialogAuthor").textContent = plugin.author;
  document.getElementById("pluginDialogApiLevel").textContent = String(plugin.apiLevel);
  document.getElementById("pluginDialogApplicableVersion").textContent = plugin.applicableVersion;
  document.getElementById("pluginDialogUpdated").textContent = plugin.updatedText;

  const repoLink = document.getElementById("pluginDialogRepoLink");
  const downloadLink = document.getElementById("pluginDialogDownloadLink");
  repoLink.href = plugin.repoUrl;
  downloadLink.href = plugin.downloadUrl;

  const tags = document.getElementById("pluginDialogTags");
  tags.innerHTML = "";
  if (plugin.tags.length === 0) {
    const none = document.createElement("span");
    none.className = "caption2";
    none.textContent = "No tags";
    tags.appendChild(none);
  } else {
    plugin.tags.forEach((tag) => {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = tag;
      tags.appendChild(badge);
    });
  }

  dialog.hidden = false;
};

const renderGrid = () => {
  const grid = document.getElementById("pluginGrid");
  grid.innerHTML = "";

  if (state.filteredPlugins.length === 0) {
    showStatus(state.plugins.length === 0 ? "No plugins published yet." : "No plugins match your search.");
    return;
  }

  showStatus(`Showing ${state.filteredPlugins.length} plugin${state.filteredPlugins.length === 1 ? "" : "s"}.`);

  state.filteredPlugins.forEach((plugin) => {
    const row = document.createElement("article");
    row.className = "pluginRow";
    row.dataset.searchText = plugin.searchText;

    const rowBody = document.createElement("div");
    rowBody.className = "pluginRowBody";

    const iconSlot = document.createElement("div");
    iconSlot.className = "pluginIconSlot";
    if (plugin.iconUrl) {
      const icon = document.createElement("img");
      icon.className = "pluginIcon";
      icon.src = plugin.iconUrl;
      icon.alt = `${plugin.name} icon`;
      icon.loading = "lazy";
      icon.referrerPolicy = "no-referrer";
      icon.onerror = () => {
        iconSlot.innerHTML = "";
        iconSlot.appendChild(createIconFallback(plugin.name));
      };
      iconSlot.appendChild(icon);
    } else {
      iconSlot.appendChild(createIconFallback(plugin.name));
    }

    const content = document.createElement("div");
    content.className = "col pluginCellContent";

    const pluginName = document.createElement("strong");
    pluginName.textContent = plugin.name;
    const punchline = document.createElement("span");
    punchline.className = "caption2";
    punchline.textContent = plugin.punchline;
    const internalName = document.createElement("span");
    internalName.className = "mono";
    internalName.textContent = plugin.internalName;

    content.appendChild(pluginName);
    content.appendChild(punchline);
    content.appendChild(internalName);

    const tagWrap = document.createElement("div");
    tagWrap.className = "tagCellContent mt-2";
    if (plugin.tags.length === 0) {
      const noTags = document.createElement("span");
      noTags.className = "caption2";
      noTags.textContent = "No tags";
      tagWrap.appendChild(noTags);
    } else {
      plugin.tags.forEach((tag) => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = tag;
        tagWrap.appendChild(badge);
      });
    }
    content.appendChild(tagWrap);

    const actionWrap = document.createElement("div");
    actionWrap.className = "row align-items-center mt-2";

    const detailsButton = document.createElement("fluent-button");
    detailsButton.appearance = "accent";
    detailsButton.textContent = "Details";
    detailsButton.addEventListener("click", () => openPluginDialog(plugin));

    const moreButton = document.createElement("fluent-button");
    moreButton.className = "ms-2";
    moreButton.textContent = "More";
    moreButton.addEventListener("click", (event) => openRowMenu(event, plugin));

    actionWrap.appendChild(detailsButton);
    actionWrap.appendChild(moreButton);
    content.appendChild(actionWrap);

    rowBody.appendChild(iconSlot);
    rowBody.appendChild(content);
    row.appendChild(rowBody);
    grid.appendChild(row);
  });
};

const copyFieldValue = async (fieldId, buttonId, activeText = "Copied") => {
  const field = document.getElementById(fieldId);
  const button = document.getElementById(buttonId);

  try {
    await navigator.clipboard.writeText(field.value);
    const prior = button.textContent;
    button.appearance = "accent";
    button.textContent = activeText;
    setTimeout(() => {
      button.appearance = buttonId === "repoUrlCopyButton" ? "accent" : "neutral";
      button.textContent = prior;
    }, 900);
  } catch (_error) {
    showStatus("Copy failed. You can still copy the URL manually.");
  }
};

const wireStaticEvents = () => {
  document.getElementById("repoUrlCopyButton").addEventListener("click", () =>
    copyFieldValue("repoUrlField", "repoUrlCopyButton")
  );
  document.getElementById("helpRepoUrlCopyButton").addEventListener("click", () =>
    copyFieldValue("helpRepoUrlField", "helpRepoUrlCopyButton")
  );

  const addRepoHelpDialog = document.getElementById("addRepoHelpDialog");
  document.getElementById("repoHelpButton").addEventListener("click", () => {
    addRepoHelpDialog.hidden = false;
  });
  document.getElementById("addRepoHelpClose").addEventListener("click", () => {
    addRepoHelpDialog.hidden = true;
  });

  const pluginDialog = document.getElementById("pluginDialog");
  document.getElementById("pluginDialogClose").addEventListener("click", () => {
    pluginDialog.hidden = true;
  });

  document.getElementById("searchInput").addEventListener("input", (event) => {
    state.query = event.target.value ?? "";
    applySearchFilter();
    renderGrid();
  });

  document.addEventListener("click", (event) => {
    const menu = document.getElementById("rowMoreMenu");
    if (!menu.contains(event.target)) {
      hideRowMenu();
    }
  });
};

const loadPlugins = async () => {
  showStatus("Loading plugins...");

  try {
    const response = await fetch(REPO_JSON_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Repository data is not an array.");
    }

    state.plugins = payload
      .filter((item) => !item.IsHide)
      .map(normalizePlugin)
      .sort((a, b) => a.name.localeCompare(b.name));

    applySearchFilter();
    renderGrid();
  } catch (error) {
    console.error(error);
    state.plugins = [];
    state.filteredPlugins = [];
    renderGrid();
    showStatus("Could not load plugins right now. Check AuxDalamudRepo and try again.");
  }
};

(() => {
  setTheme();
  setListingHeader();
  wireStaticEvents();
  loadPlugins();

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    setTheme();
  });
})();
